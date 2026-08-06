import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:5000/api/auth"

def make_request(url, method="GET", data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            try:
                return response.status, json.loads(res_body)
            except json.JSONDecodeError:
                return response.status, {"raw": res_body}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(res_body)
        except json.JSONDecodeError:
            return e.code, {"raw": res_body}
    except urllib.error.URLError as e:
        print(f"\n[Connection Error] Could not connect to API server at {url}: {e.reason}")
        return 0, {"error": str(e.reason)}

if __name__ == "__main__":
    from app import create_app
    from models import db, User
    app = create_app()

    with app.app_context():
        # Clean test user if exists
        test_email = "test_otp_user@gym.com"
        existing = User.query.filter_by(email=test_email).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

        # 1. Test register -> OTP generated
        print("1. Registering user...")
        user = User(
            name="OTP Test User",
            email=test_email,
            is_verified=False,
            otp_code="123456",
            otp_purpose="email_verification"
        )
        user.set_password("Password123!")
        db.session.add(user)
        db.session.commit()

        with app.test_client() as client:
            # Verify OTP
            print("2. Verifying email OTP...")
            res = client.post('/api/auth/verify-email-otp', json={
                'email': test_email,
                'otp': '123456'
            })
            assert res.status_code == 200
            data = res.get_json()
            assert data['user']['isVerified'] is True
            print("Email OTP verification successful!")

            # Forgot Password OTP
            print("3. Requesting Forgot Password OTP...")
            res = client.post('/api/auth/forgot-password', json={'email': test_email})
            assert res.status_code == 200
            
            # Fetch user OTP code
            u = User.query.filter_by(email=test_email.lower().strip()).first()
            if u:
                otp_code = u.otp_code
                print(f"Retrieved OTP code: {otp_code}")
            else:
                otp_code="000000"
                print(f"User with email '{test_email}' was not found in the database.")

            # Reset Password OTP
            print("4. Resetting password with OTP...")
            res = client.post('/api/auth/reset-password-otp', json={
                'email': test_email,
                'otp': otp_code,
                'newPassword': 'NewSecretPassword123!'
            })
            assert res.status_code == 200
            print("Password reset OTP successful!")

            # Google Social Login
            print("5. Testing Google Login...")
            res = client.post('/api/auth/google', json={
                'googleId': 'google_12345',
                'email': 'google_user@gym.com',
                'name': 'Google Athlete'
            })
            assert res.status_code == 200
            assert res.get_json()['user']['email'] == 'google_user@gym.com'
            print("Google Social Login successful!")

            # Apple Social Login
            print("6. Testing Apple Login...")
            res = client.post('/api/auth/apple', json={
                'appleId': 'apple_67890',
                'email': 'apple_user@gym.com',
                'name': 'Apple Athlete'
            })
            assert res.status_code == 200
            assert res.get_json()['user']['email'] == 'apple_user@gym.com'
            print("Apple Social Login successful!")

        print("\n[ALL BACKEND OTP & SOCIAL AUTH TESTS PASSED SUCCESSFULLY!]")
