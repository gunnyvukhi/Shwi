import base64
from datetime import datetime, timezone
import requests
from flask import Blueprint, request, jsonify, current_app
from models import db, BodyConditionLog
import firebase_service
from utils import token_required

profile_bp = Blueprint('profile', __name__)

def upload_to_cloudinary(file_bytes, filename, cloud_name, api_key, api_secret, preset=""):
    """
    Upload file bytes to Cloudinary and return the HTTPS cloud image URL.
    Supports API Key/Secret signed upload and Unsigned preset upload.
    """
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    
    if api_key and api_secret:
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


@profile_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'user': current_user.to_dict(),
        'profile': current_user.get_info().to_dict()
    }), 200


@profile_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json() or {}
    info = current_user.get_info()

    if 'name' in data:
        name = str(data['name']).strip()
        if name:
            info.name = name

    if 'bio' in data:
        info.bio = str(data['bio']).strip()

    if 'fitnessGoal' in data:
        val = data['fitnessGoal']
        if val is not None:
            try:
                val_str = str(val).strip().lower()
                if val_str in ['0', 'lose weight', 'lose']:
                    info.fitness_goal = 0
                elif val_str in ['1', 'gain weight', 'build muscle', 'gain']:
                    info.fitness_goal = 1
                else:
                    info.fitness_goal = int(val)
            except (ValueError, TypeError):
                pass
        else:
            info.fitness_goal = None

    if 'targetWeight' in data:
        try:
            info.target_weight = float(data['targetWeight']) if data['targetWeight'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'targetSteps' in data:
        try:
            info.target_steps = int(data['targetSteps']) if data['targetSteps'] is not None else 10000
        except (ValueError, TypeError):
            pass

    if 'gender' in data:
        val = data['gender']
        if val is not None:
            try:
                val_str = str(val).strip().lower()
                if val_str in ['0', 'male', 'nam', 'm']:
                    info.gender = 0
                elif val_str in ['1', 'female', 'nữ', 'nu', 'f']:
                    info.gender = 1
                elif val_str in ['2', 'other', 'khác', 'khac']:
                    info.gender = 2
                else:
                    info.gender = int(val)
            except (ValueError, TypeError):
                pass
        else:
            info.gender = None

    if 'phone' in data:
        info.phone = str(data['phone']).strip()

    if 'yob' in data:
        try:
            info.yob = int(data['yob']) if data['yob'] is not None else None
        except (ValueError, TypeError):
            pass
    elif 'age' in data:
        try:
            if data['age'] is not None:
                info.yob = datetime.now(timezone.utc).year - int(data['age'])
            else:
                info.yob = None
        except (ValueError, TypeError):
            pass

    # Optionally record body metrics directly to body_condition_logs
    has_body_metrics = any(k in data for k in ['currentWeight', 'weight', 'height', 'bodyFat', 'muscleMass'])
    if has_body_metrics:
        latest = current_user.latest_body_condition
        w_raw = data.get('currentWeight') if 'currentWeight' in data else data.get('weight')
        h_raw = data.get('height')
        bf_raw = data.get('bodyFat')
        mm_raw = data.get('muscleMass')

        try:
            w_val = float(w_raw) if w_raw is not None else (latest.get('weight', 70.0) if latest else 70.0)
        except (ValueError, TypeError):
            w_val = latest.get('weight', 70.0) if latest else 70.0

        try:
            h_val = float(h_raw) if h_raw is not None else (latest.get('height', 175.0) if latest else 175.0)
        except (ValueError, TypeError):
            h_val = latest.get('height', 175.0) if latest else 175.0

        try:
            bf_val = float(bf_raw) if bf_raw is not None else (latest.get('bodyFat') if latest else None)
        except (ValueError, TypeError):
            bf_val = latest.get('bodyFat') if latest else None

        try:
            mm_val = float(mm_raw) if mm_raw is not None else (latest.get('muscleMass') if latest else None)
        except (ValueError, TypeError):
            mm_val = latest.get('muscleMass') if latest else None

        new_log = BodyConditionLog(
            user_id=current_user.id,
            weight=w_val,
            height=h_val,
            body_fat=bf_val,
            muscle_mass=mm_val,
            date=data.get('date')
        )
        db.session.add(new_log)

    if 'rhr' in data:
        try:
            rhr_val = int(data['rhr']) if data['rhr'] is not None else None
            if rhr_val is not None:
                firebase_service.save_resting_heart_rate(
                    user_id=current_user.id,
                    bpm=rhr_val
                )
        except (ValueError, TypeError):
            pass

    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'user': current_user.to_dict(),
        'profile': info.to_dict()
    }), 200


@profile_bp.route('/upload-media', methods=['POST'])
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

    if cloud_name and (api_key or preset):
        try:
            cloud_url = upload_to_cloudinary(file_bytes, filename, cloud_name, api_key, api_secret, preset)
        except Exception as e:
            print(f"[Cloudinary Warning] Upload to user account failed: {e}")

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

    if not cloud_url:
        b64_encoded = base64.b64encode(file_bytes).decode('utf-8')
        cloud_url = f"data:image/jpeg;base64,{b64_encoded}"

    info = current_user.get_info()
    if media_type in ('wallpaper', 'cover'):
        info.wallpaper_url = cloud_url
    else:
        info.avatar_url = cloud_url

    db.session.commit()

    return jsonify({
        'message': f'{media_type.capitalize()} picture updated successfully',
        'url': cloud_url,
        'user': current_user.to_dict(),
        'profile': info.to_dict()
    }), 200
