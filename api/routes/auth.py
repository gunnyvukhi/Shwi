import re
import secrets
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app

from models import db, User
from utils import generate_jwt_token, generate_reset_token, token_required
from email_service import generate_otp, send_otp_email

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_REGEX = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name:
        return jsonify({'error': 'Name is required'}), 400
    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({'error': 'Valid email address is required'}), 400
    if not password or len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    existing_user = User.query.filter_by(email=email).first()
    
    if existing_user and existing_user.is_verified:
        return jsonify({'error': 'An account with this email already exists'}), 409

    otp_code = generate_otp()
    otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

    if existing_user and not existing_user.is_verified:
        # Re-use unverified user account
        user = existing_user
        user.name = name
        user.set_password(password)
        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        user.otp_purpose = 'email_verification'
    else:
        user = User(
            name=name,
            email=email,
            is_verified=False,
            otp_code=otp_code,
            otp_expiry=otp_expiry,
            otp_purpose='email_verification'
        )
        user.set_password(password)
        db.session.add(user)

    db.session.commit()

    # Send OTP Email
    send_otp_email(email, otp_code, purpose='email_verification')

    return jsonify({
        'message': 'Account created! Please enter the 6-digit OTP code sent to your email to verify.',
        'email': email,
        'requireOtp': True
    }), 200


@auth_bp.route('/verify-email-otp', methods=['POST'])
def verify_email_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip()

    if not email or not otp:
        return jsonify({'error': 'Email and 6-digit OTP code are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User account not found'}), 404

    if user.is_verified:
        token = generate_jwt_token(user.id)
        return jsonify({
            'message': 'Email is already verified',
            'token': token,
            'user': user.to_dict()
        }), 200

    if not user.otp_code or user.otp_purpose != 'email_verification':
        return jsonify({'error': 'No active verification OTP found. Please request a new code.'}), 400

    if user.otp_code != otp:
        return jsonify({'error': 'Invalid 6-digit OTP code. Please try again.'}), 400

    if user.otp_expiry:
        expiry = user.otp_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            return jsonify({'error': 'OTP code has expired. Please request a new verification code.'}), 400

    # Mark user as verified
    user.is_verified = True
    user.otp_code = None
    user.otp_expiry = None
    user.otp_purpose = None
    db.session.commit()

    token = generate_jwt_token(user.id)
    return jsonify({
        'message': 'Email verified successfully! Welcome to Shuvi Gym.',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/resend-otp', methods=['POST'])
def resend_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', 'email_verification').strip()

    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({'error': 'Valid email address is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Account not found'}), 404

    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    user.otp_purpose = purpose
    db.session.commit()

    send_otp_email(email, otp_code, purpose=purpose)

    return jsonify({
        'message': f'A new 6-digit OTP code has been sent to {email}.'
    }), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_verified:
        # Generate fresh OTP and request verification
        otp_code = generate_otp()
        user.otp_code = otp_code
        user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
        user.otp_purpose = 'email_verification'
        db.session.commit()

        send_otp_email(email, otp_code, purpose='email_verification')

        return jsonify({
            'error': 'Your email address is not verified yet. A 6-digit OTP code has been sent to your email.',
            'email': email,
            'requireVerification': True
        }), 403

    token = generate_jwt_token(user.id)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email or not re.match(EMAIL_REGEX, email):
        return jsonify({'error': 'Valid email address is required'}), 400

    response_msg = 'If an account exists with that email, a 6-digit password reset OTP code has been sent.'
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': response_msg, 'email': email, 'requireOtp': True}), 200

    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    user.otp_purpose = 'password_reset'
    db.session.commit()

    send_otp_email(email, otp_code, purpose='password_reset')

    return jsonify({
        'message': response_msg,
        'email': email,
        'requireOtp': True
    }), 200


@auth_bp.route('/reset-password-otp', methods=['POST'])
@auth_bp.route('/reset-password', methods=['POST'])
def reset_password_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '').strip() or data.get('token', '').strip()
    new_password = data.get('newPassword', '')

    if not new_password or len(new_password) < 6:
        return jsonify({'error': 'New password must be at least 6 characters long'}), 400
    if not otp:
        return jsonify({'error': '6-digit OTP code is required'}), 400

    user = None
    if email:
        user = User.query.filter_by(email=email).first()
    
    # Fallback to search by token or otp if email is not provided
    if not user and otp:
        user = User.query.filter(
            (User.otp_code == otp) | (User.reset_token == otp)
        ).first()

    if not user:
        return jsonify({'error': 'Invalid email or OTP code'}), 400

    # Validate OTP if purpose matches or code matches
    is_valid_otp = (user.otp_code and user.otp_code == otp and user.otp_purpose == 'password_reset')
    is_valid_token = (user.reset_token and user.reset_token == otp)

    if not (is_valid_otp or is_valid_token):
        return jsonify({'error': 'Invalid 6-digit OTP reset code'}), 400

    # Check expiry
    expiry = user.otp_expiry if is_valid_otp else user.reset_token_expiry
    if expiry:
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            return jsonify({'error': 'OTP reset code has expired. Please request a new password reset.'}), 400

    user.set_password(new_password)
    user.is_verified = True  # Resetting password proves email ownership
    user.otp_code = None
    user.otp_expiry = None
    user.otp_purpose = None
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()

    token = generate_jwt_token(user.id)
    return jsonify({
        'message': 'Password reset successfully!',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    id_token = data.get('idToken') or data.get('credential') or data.get('token')
    
    google_id = None
    email = None
    name = None
    avatar_url = None

    client_id = current_app.config.get('GOOGLE_CLIENT_ID')

    if id_token:
        try:

            req = google_requests.Request()
            id_info = google_id_token.verify_oauth2_token(
                id_token, 
                req, 
                audience=client_id if client_id else None
            )

            google_id = id_info.get('sub')
            email = id_info.get('email', '').strip().lower()
            name = id_info.get('name') or id_info.get('given_name', 'Google User')
            avatar_url = id_info.get('picture', '')
        except Exception as e:
            print(f"[Google Auth Verification Notice] Token verification note: {e}")
            if client_id:
                return jsonify({'error': f'Google token verification failed: {str(e)}'}), 400

    if not email:
        google_id = google_id or data.get('googleId', '').strip() or data.get('sub', '').strip()
        email = data.get('email', '').strip().lower()
        name = name or data.get('name', '').strip() or 'Google User'
        avatar_url = avatar_url or data.get('avatarUrl', '').strip() or data.get('picture', '').strip()

    if not email:
        return jsonify({'error': 'Google authentication failed: Email address is required'}), 400

    user = None
    if google_id:
        user = User.query.filter_by(google_id=google_id).first()
    if not user:
        user = User.query.filter_by(email=email).first()

    if user:
        if not user.google_id and google_id:
            user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        user.is_verified = True
    else:
        user = User(
            name=name,
            email=email,
            google_id=google_id or f"google_{secrets.token_hex(8)}",
            avatar_url=avatar_url,
            is_verified=True
        )
        user.set_password(secrets.token_urlsafe(16))
        db.session.add(user)

    db.session.commit()

    token = generate_jwt_token(user.id)
    return jsonify({
        'message': 'Google authentication successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/apple', methods=['POST'])
def apple_auth():
    data = request.get_json() or {}
    identity_token = data.get('identityToken') or data.get('id_token') or data.get('token')
    
    apple_id = None
    email = None
    name = data.get('name', '').strip() or 'Apple User'

    client_id = current_app.config.get('APPLE_CLIENT_ID')

    if identity_token:
        try:
            import jwt
            jwks_client = jwt.PyJWKClient("https://appleid.apple.com/auth/keys")
            signing_key = jwks_client.get_signing_key_from_jwt(identity_token)
            
            payload = jwt.decode(
                identity_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=client_id if client_id else None
            )

            apple_id = payload.get('sub')
            if payload.get('email'):
                email = payload.get('email', '').strip().lower()
        except Exception as e:
            print(f"[Apple Auth Verification Notice] Token verification note: {e}")
            if client_id:
                return jsonify({'error': f'Apple token verification failed: {str(e)}'}), 400

    if not apple_id and not email:
        apple_id = data.get('appleId', '').strip() or data.get('sub', '').strip()
        email = data.get('email', '').strip().lower()

    if not apple_id and not email:
        return jsonify({'error': 'Apple authentication failed: Insufficient user credentials'}), 400

    user = None
    if apple_id:
        user = User.query.filter_by(apple_id=apple_id).first()
    if not user and email:
        user = User.query.filter_by(email=email).first()

    if user:
        if not user.apple_id and apple_id:
            user.apple_id = apple_id
        user.is_verified = True
    else:
        assigned_email = email or f"{apple_id}@privaterelay.appleid.com"
        user = User(
            name=name,
            email=assigned_email,
            apple_id=apple_id or f"apple_{secrets.token_hex(8)}",
            is_verified=True
        )
        user.set_password(secrets.token_urlsafe(16))
        db.session.add(user)

    db.session.commit()

    token = generate_jwt_token(user.id)
    return jsonify({
        'message': 'Apple authentication successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'user': current_user.to_dict()
    }), 200
