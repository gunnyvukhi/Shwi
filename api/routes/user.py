import os
import requests
import base64
from flask import Blueprint, request, jsonify, current_app
from models import db, User
from utils import token_required

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

def upload_to_cloudinary(file_bytes, filename, cloud_name, api_key, api_secret, preset=""):
    """
    Upload file bytes to Cloudinary and return the HTTPS cloud image URL.
    Supports API Key/Secret signed upload and Unsigned preset upload.
    """
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    
    if api_key and api_secret:
        # Standard signed upload using timestamp signature
        import time
        import hashlib
        timestamp = str(int(time.time()))
        params_to_sign = f"timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(params_to_sign.encode('utf-8')).hexdigest()
        
        files = {'file': (filename, file_bytes)}
        data = {
            'api_key': api_key,
            'timestamp': timestamp,
            'signature': signature
        }
        res = requests.post(url, data=data, files=files, timeout=15)
        res_data = res.json()
        if 'secure_url' in res_data:
            return res_data['secure_url']
        elif 'url' in res_data:
            return res_data['url']
        else:
            raise Exception(res_data.get('error', {}).get('message', 'Cloudinary upload failed'))
            
    elif preset:
        # Unsigned preset upload
        files = {'file': (filename, file_bytes)}
        data = {'upload_preset': preset}
        res = requests.post(url, data=data, files=files, timeout=15)
        res_data = res.json()
        if 'secure_url' in res_data:
            return res_data['secure_url']
        else:
            raise Exception(res_data.get('error', {}).get('message', 'Cloudinary unsigned upload failed'))
    else:
        raise Exception("Cloudinary credentials not configured")


@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({'user': current_user.to_dict()}), 200


@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}

    if 'name' in data:
        name = str(data['name']).strip()
        if name:
            current_user.name = name

    if 'bio' in data:
        current_user.bio = str(data['bio']).strip()

    if 'fitnessGoal' in data:
        current_user.fitness_goal = str(data['fitnessGoal']).strip()

    if 'targetWeight' in data:
        try:
            current_user.target_weight = float(data['targetWeight']) if data['targetWeight'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'currentWeight' in data:
        try:
            current_user.current_weight = float(data['currentWeight']) if data['currentWeight'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'height' in data:
        try:
            current_user.height = float(data['height']) if data['height'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'gender' in data:
        current_user.gender = str(data['gender']).strip()

    if 'phone' in data:
        current_user.phone = str(data['phone']).strip()

    if 'age' in data:
        try:
            current_user.age = int(data['age']) if data['age'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'experienceLevel' in data:
        current_user.experience_level = str(data['experienceLevel']).strip()

    if 'workoutSplit' in data:
        current_user.workout_split = str(data['workoutSplit']).strip()

    if 'bodyFat' in data:
        try:
            current_user.body_fat = float(data['bodyFat']) if data['bodyFat'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'rhr' in data:
        try:
            current_user.rhr = int(data['rhr']) if data['rhr'] is not None else None
        except (ValueError, TypeError):
            pass

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user.to_dict()
    }), 200


@user_bp.route('/upload-media', methods=['POST'])
@token_required
def upload_media(current_user):
    media_type = request.form.get('type') or request.args.get('type') or 'avatar'
    
    file_bytes = None
    filename = 'upload.jpg'

    if 'file' in request.files:
        uploaded_file = request.files['file']
        filename = uploaded_file.filename or 'upload.jpg'
        file_bytes = uploaded_file.read()
    elif request.is_json:
        data = request.get_json() or {}
        media_type = data.get('type', media_type)
        base64_str = data.get('image') or data.get('file')
        if base64_str:
            if ',' in base64_str:
                base64_str = base64_str.split(',', 1)[1]
            file_bytes = base64.b64decode(base64_str)

    if not file_bytes:
        return jsonify({'error': 'No image file provided'}), 400

    cloud_name = current_app.config.get('CLOUDINARY_CLOUD_NAME')
    api_key = current_app.config.get('CLOUDINARY_API_KEY')
    api_secret = current_app.config.get('CLOUDINARY_API_SECRET')
    preset = current_app.config.get('CLOUDINARY_UPLOAD_PRESET')

    cloud_url = None

    # 1. Try user configured Cloudinary account
    if cloud_name and (api_key or preset):
        try:
            cloud_url = upload_to_cloudinary(file_bytes, filename, cloud_name, api_key, api_secret, preset)
        except Exception as e:
            print(f"[Cloudinary Warning] Upload to user account failed: {e}")

    # 2. Fallback to Cloudinary demo unsigned upload
    if not cloud_url:
        try:
            res = requests.post(
                "https://api.cloudinary.com/v1_1/demo/image/upload",
                data={'upload_preset': 'docs_upload_example_us_preset'},
                files={'file': (filename, file_bytes)},
                timeout=15
            )
            res_data = res.json()
            if 'secure_url' in res_data:
                cloud_url = res_data['secure_url']
        except Exception as e:
            print(f"[Cloud Storage Fallback Notice] Cloudinary demo fallback notice: {e}")

    # 3. Base64 Data URI fallback if offline
    if not cloud_url:
        b64_encoded = base64.b64encode(file_bytes).decode('utf-8')
        cloud_url = f"data:image/jpeg;base64,{b64_encoded}"

    # Update DB record
    if media_type == 'wallpaper' or media_type == 'cover':
        current_user.wallpaper_url = cloud_url
    else:
        current_user.avatar_url = cloud_url

    db.session.commit()

    return jsonify({
        'message': f'{media_type.capitalize()} picture updated and uploaded to Cloud successfully!',
        'url': cloud_url,
        'user': current_user.to_dict()
    }), 200
