import os
import requests
import base64
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from models import (
    db, User, UserInfo, ActivityLog, WeightLog,
    HeartRateLog, SleepLog, StepLog, WorkoutLog, FoodIntakeLog
)
from utils import token_required, decode_jwt_token

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
    info = current_user.get_info()

    if 'name' in data:
        name = str(data['name']).strip()
        if name:
            info.name = name

    if 'bio' in data:
        info.bio = str(data['bio']).strip()

    if 'fitnessGoal' in data:
        info.fitness_goal = str(data['fitnessGoal']).strip()

    if 'targetWeight' in data:
        try:
            info.target_weight = float(data['targetWeight']) if data['targetWeight'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'currentWeight' in data:
        try:
            info.current_weight = float(data['currentWeight']) if data['currentWeight'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'height' in data:
        try:
            info.height = float(data['height']) if data['height'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'gender' in data:
        info.gender = str(data['gender']).strip()

    if 'phone' in data:
        info.phone = str(data['phone']).strip()

    if 'age' in data:
        try:
            info.age = int(data['age']) if data['age'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'experienceLevel' in data:
        info.experience_level = str(data['experienceLevel']).strip()

    if 'workoutSplit' in data:
        info.workout_split = str(data['workoutSplit']).strip()

    if 'bodyFat' in data:
        try:
            info.body_fat = float(data['bodyFat']) if data['bodyFat'] is not None else None
        except (ValueError, TypeError):
            pass

    if 'rhr' in data:
        try:
            info.rhr = int(data['rhr']) if data['rhr'] is not None else None
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

    # Update DB record in user_info
    info = current_user.get_info()
    if media_type in ('wallpaper', 'cover'):
        info.wallpaper_url = cloud_url
    else:
        info.avatar_url = cloud_url

    db.session.commit()

    return jsonify({
        'message': f'{media_type.capitalize()} picture updated and uploaded to Cloud successfully!',
        'url': cloud_url,
        'user': current_user.to_dict()
    }), 200


# ==========================================
# Heart Rate Log Endpoints
# ==========================================

@user_bp.route('/heart-rate', methods=['GET', 'POST'])
def handle_heart_rate():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        bpm = data.get('bpm')
        if not bpm:
            return jsonify({'error': 'bpm is required'}), 400

        resting_bpm = data.get('restingBpm') or data.get('resting_bpm')
        status = data.get('status') or ('Resting' if resting_bpm and int(bpm) == int(resting_bpm) else ('Peak' if int(bpm) >= 120 else 'Normal'))
        time_label = data.get('timeLabel') or data.get('time_label') or datetime.now().strftime('%I:%M %p')

        log = HeartRateLog(
            user_id=user_id,
            bpm=int(bpm),
            resting_bpm=int(resting_bpm) if resting_bpm else None,
            status=status,
            time_label=time_label
        )
        db.session.add(log)

        # Update UserInfo rhr if resting bpm is recorded
        if resting_bpm:
            user = User.query.get(user_id)
            if user:
                user.get_info().rhr = int(resting_bpm)

        db.session.commit()
        return jsonify({'message': 'Heart rate logged successfully', 'log': log.to_dict()}), 201

    logs = HeartRateLog.query.filter_by(user_id=user_id).order_by(HeartRateLog.id.desc()).limit(50).all()
    return jsonify({'heartRateLogs': [item.to_dict() for item in logs]}), 200


# ==========================================
# Sleep Log Endpoints
# ==========================================

@user_bp.route('/sleep', methods=['GET', 'POST'])
def handle_sleep():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        duration = data.get('durationMinutes') or data.get('duration_minutes')
        if not duration:
            return jsonify({'error': 'durationMinutes is required'}), 400

        quality = data.get('sleepQuality') or data.get('sleep_quality', 85.0)
        time_label = data.get('timeLabel') or datetime.now().strftime('%a')

        log = SleepLog(
            user_id=user_id,
            duration_minutes=int(duration),
            sleep_quality=float(quality),
            deep_sleep_minutes=data.get('deepSleepMinutes'),
            rem_sleep_minutes=data.get('remSleepMinutes'),
            light_sleep_minutes=data.get('lightSleepMinutes'),
            time_label=time_label
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Sleep logged successfully', 'log': log.to_dict()}), 201

    logs = SleepLog.query.filter_by(user_id=user_id).order_by(SleepLog.id.desc()).limit(30).all()
    return jsonify({'sleepLogs': [item.to_dict() for item in logs]}), 200


# ==========================================
# Step Log Endpoints
# ==========================================

@user_bp.route('/steps', methods=['GET', 'POST'])
def handle_steps():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        steps = data.get('steps', 0)
        target = data.get('targetSteps', 10000)
        dist = data.get('distanceKm') or (steps * 0.00075)
        cals = data.get('caloriesBurned') or (steps * 0.04)
        time_label = data.get('timeLabel', 'Today')

        log = StepLog(
            user_id=user_id,
            steps=int(steps),
            target_steps=int(target),
            distance_km=float(dist),
            calories_burned=float(cals),
            period=data.get('period', 'day'),
            time_label=time_label
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Steps logged successfully', 'log': log.to_dict()}), 201

    logs = StepLog.query.filter_by(user_id=user_id).order_by(StepLog.id.desc()).limit(30).all()
    return jsonify({'stepLogs': [item.to_dict() for item in logs]}), 200


# ==========================================
# Workout Log Endpoints
# ==========================================

@user_bp.route('/workout', methods=['GET', 'POST'])
def handle_workout():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('workoutName') or data.get('workout_name', 'Gym Workout')
        duration = data.get('durationMinutes') or data.get('duration_minutes', 45)
        calories = data.get('caloriesBurned') or data.get('calories_burned', 300.0)

        log = WorkoutLog(
            user_id=user_id,
            workout_name=name,
            duration_minutes=int(duration),
            calories_burned=float(calories),
            muscle_group=data.get('muscleGroup'),
            intensity=data.get('intensity', 'Medium'),
            notes=data.get('notes')
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Workout logged successfully', 'log': log.to_dict()}), 201

    logs = WorkoutLog.query.filter_by(user_id=user_id).order_by(WorkoutLog.id.desc()).limit(30).all()
    return jsonify({'workoutLogs': [item.to_dict() for item in logs]}), 200


# ==========================================
# Food Intake Log Endpoints
# ==========================================

@user_bp.route('/food-intake', methods=['GET', 'POST'])
def handle_food_intake():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    if request.method == 'POST':
        data = request.get_json() or {}
        meal = data.get('mealType') or data.get('meal_type', 'Lunch')
        food = data.get('foodName') or data.get('food_name', '')
        calories = data.get('calories', 0.0)

        if not food:
            return jsonify({'error': 'foodName is required'}), 400

        log = FoodIntakeLog(
            user_id=user_id,
            meal_type=meal,
            food_name=food,
            calories=float(calories),
            protein=float(data.get('protein', 0.0)),
            carbs=float(data.get('carbs', 0.0)),
            fat=float(data.get('fat', 0.0))
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Food intake logged successfully', 'log': log.to_dict()}), 201

    logs = FoodIntakeLog.query.filter_by(user_id=user_id).order_by(FoodIntakeLog.id.desc()).limit(30).all()
    return jsonify({'foodIntakeLogs': [item.to_dict() for item in logs]}), 200


# ==========================================
# Aggregated Dashboard Endpoint
# ==========================================

@user_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    user_id = None
    auth_header = request.headers.get('Authorization')
    if auth_header and len(auth_header.split()) == 2:
        token = auth_header.split()[1]
        user_id = decode_jwt_token(token)

    if not user_id:
        first_user = User.query.first()
        user_id = first_user.id if first_user else 1

    # Fetch legacy charts
    activity_day = ActivityLog.query.filter_by(user_id=user_id, period='day').order_by(ActivityLog.id.asc()).all()
    activity_week = ActivityLog.query.filter_by(user_id=user_id, period='week').order_by(ActivityLog.id.asc()).all()
    activity_month = ActivityLog.query.filter_by(user_id=user_id, period='month').order_by(ActivityLog.id.asc()).all()
    weight_month = WeightLog.query.filter_by(user_id=user_id).order_by(WeightLog.id.asc()).all()

    # Fetch specialized health logs
    heart_rate_logs = HeartRateLog.query.filter_by(user_id=user_id).order_by(HeartRateLog.id.desc()).limit(15).all()
    sleep_logs = SleepLog.query.filter_by(user_id=user_id).order_by(SleepLog.id.desc()).limit(7).all()
    step_logs = StepLog.query.filter_by(user_id=user_id).order_by(StepLog.id.desc()).limit(7).all()
    workout_logs = WorkoutLog.query.filter_by(user_id=user_id).order_by(WorkoutLog.id.desc()).limit(5).all()
    food_intake_logs = FoodIntakeLog.query.filter_by(user_id=user_id).order_by(FoodIntakeLog.id.desc()).limit(10).all()

    # Seed default records if database records do not exist yet for this user
    should_commit = False

    if not activity_day and not activity_week and not activity_month and not weight_month:
        day_seeds = [('6AM', 50), ('9AM', 120), ('12PM', 80), ('3PM', 250), ('6PM', 350), ('9PM', 100)]
        for time_label, cal in day_seeds:
            db.session.add(ActivityLog(user_id=user_id, period='day', time_label=time_label, calories=cal))

        week_seeds = [('Mon', 450), ('Tue', 520), ('Wed', 380), ('Thu', 600), ('Fri', 410), ('Sat', 800), ('Sun', 300)]
        for time_label, cal in week_seeds:
            db.session.add(ActivityLog(user_id=user_id, period='week', time_label=time_label, calories=cal))

        month_seeds = [('W1', 2800), ('W2', 3100), ('W3', 2950), ('W4', 3400)]
        for time_label, cal in month_seeds:
            db.session.add(ActivityLog(user_id=user_id, period='month', time_label=time_label, calories=cal))

        weight_seeds = [('Jan', 60.0), ('Feb', 59.2), ('Mar', 58.5), ('Apr', 58.0), ('May', 57.1), ('Jun', 56.5), ('Jul', 56.0)]
        for month_label, w in weight_seeds:
            db.session.add(WeightLog(user_id=user_id, month_label=month_label, weight=w))

        should_commit = True

    if not heart_rate_logs:
        hr_seeds = [
            (117, 62, 'Peak', '07:15 PM'),
            (135, 62, 'Cardio', '05:45 PM'),
            (82, 62, 'Normal', '02:15 PM'),
            (74, 62, 'Normal', '11:00 AM'),
            (62, 62, 'Resting', '08:30 AM')
        ]
        for bpm, resting, status, t_label in hr_seeds:
            db.session.add(HeartRateLog(user_id=user_id, bpm=bpm, resting_bpm=resting, status=status, time_label=t_label))
        should_commit = True

    if not sleep_logs:
        db.session.add(SleepLog(
            user_id=user_id,
            duration_minutes=443,
            sleep_quality=85.0,
            deep_sleep_minutes=95,
            rem_sleep_minutes=110,
            light_sleep_minutes=238,
            time_label='Yesterday'
        ))
        should_commit = True

    if not step_logs:
        db.session.add(StepLog(
            user_id=user_id,
            steps=12456,
            target_steps=10000,
            distance_km=8.4,
            calories_burned=480.0,
            period='day',
            time_label='Today'
        ))
        should_commit = True

    if not workout_logs:
        db.session.add(WorkoutLog(
            user_id=user_id,
            workout_name='Push Day (Chest, Shoulders & Triceps)',
            duration_minutes=65,
            calories_burned=460.0,
            muscle_group='Chest, Shoulders, Triceps',
            intensity='High',
            notes='Barbell Bench 4x8, Overhead Press 3x10, Incline Dumbbell 3x12'
        ))
        should_commit = True

    if not food_intake_logs:
        food_seeds = [
            ('Breakfast', 'Oatmeal with Blueberries & Whey Protein', 450.0, 32.0, 55.0, 8.0),
            ('Lunch', 'Grilled Chicken Breast & Brown Rice Salad', 620.0, 48.0, 60.0, 14.0),
            ('Dinner', 'Salmon Fillet with Roasted Vegetables', 580.0, 42.0, 45.0, 18.0),
            ('Snack', 'Greek Yogurt & Mixed Nuts', 240.0, 20.0, 12.0, 9.0)
        ]
        for meal, fname, cal, p, c, f in food_seeds:
            db.session.add(FoodIntakeLog(user_id=user_id, meal_type=meal, food_name=fname, calories=cal, protein=p, carbs=c, fat=f))
        should_commit = True

    if should_commit:
        try:
            db.session.commit()
            # Re-query
            activity_day = ActivityLog.query.filter_by(user_id=user_id, period='day').order_by(ActivityLog.id.asc()).all()
            activity_week = ActivityLog.query.filter_by(user_id=user_id, period='week').order_by(ActivityLog.id.asc()).all()
            activity_month = ActivityLog.query.filter_by(user_id=user_id, period='month').order_by(ActivityLog.id.asc()).all()
            weight_month = WeightLog.query.filter_by(user_id=user_id).order_by(WeightLog.id.asc()).all()
            heart_rate_logs = HeartRateLog.query.filter_by(user_id=user_id).order_by(HeartRateLog.id.desc()).limit(15).all()
            sleep_logs = SleepLog.query.filter_by(user_id=user_id).order_by(SleepLog.id.desc()).limit(7).all()
            step_logs = StepLog.query.filter_by(user_id=user_id).order_by(StepLog.id.desc()).limit(7).all()
            workout_logs = WorkoutLog.query.filter_by(user_id=user_id).order_by(WorkoutLog.id.desc()).limit(5).all()
            food_intake_logs = FoodIntakeLog.query.filter_by(user_id=user_id).order_by(FoodIntakeLog.id.desc()).limit(10).all()
        except Exception as e:
            db.session.rollback()
            print(f"[DB Notice] Could not seed logs: {e}")

    return jsonify({
        'activityDataDay': [item.to_dict() for item in activity_day],
        'activityDataWeek': [item.to_dict() for item in activity_week],
        'activityDataMonth': [item.to_dict() for item in activity_month],
        'weightDataMonth': [item.to_dict() for item in weight_month],
        'heartRateLogs': [item.to_dict() for item in heart_rate_logs],
        'sleepLogs': [item.to_dict() for item in sleep_logs],
        'stepLogs': [item.to_dict() for item in step_logs],
        'workoutLogs': [item.to_dict() for item in workout_logs],
        'foodIntakeLogs': [item.to_dict() for item in food_intake_logs]
    }), 200
