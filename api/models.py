from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    """
    Core User model focusing strictly on authentication, credentials, roles, and security tokens.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)
    otp_purpose = db.Column(db.String(30), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    apple_id = db.Column(db.String(255), unique=True, nullable=True)
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # 1-to-1 relationship with UserInfo
    info = db.relationship(
        'UserInfo',
        backref=db.backref('user', lazy='joined'),
        uselist=False,
        cascade='all, delete-orphan',
        lazy='joined'
    )

    # Relationships to logs with cascade delete
    heart_rate_logs = db.relationship('HeartRateLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    sleep_logs = db.relationship('SleepLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    step_logs = db.relationship('StepLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    workout_logs = db.relationship('WorkoutLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    food_intake_logs = db.relationship('FoodIntakeLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    activity_logs = db.relationship('ActivityLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    weight_logs = db.relationship('WeightLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')

    def __init__(self, **kwargs):
        # Extract UserInfo profile attributes if provided directly to User
        info_attrs = {
            'name', 'avatar_url', 'wallpaper_url', 'bio', 'fitness_goal',
            'target_weight', 'current_weight', 'height', 'gender', 'phone',
            'age', 'experience_level', 'workout_split', 'body_fat', 'rhr'
        }
        info_data = {}
        for attr in info_attrs:
            if attr in kwargs:
                info_data[attr] = kwargs.pop(attr)

        super().__init__(**kwargs)

        # Initialize UserInfo if not already attached
        if not self.info:
            self.info = UserInfo(**info_data)
        elif info_data:
            for k, v in info_data.items():
                setattr(self.info, k, v)

    def get_info(self):
        """Helper to ensure UserInfo instance is always available."""
        if not self.info:
            self.info = UserInfo(user_id=self.id)
            db.session.add(self.info)
        return self.info

    # Property proxies to maintain seamless backward-compatibility
    @property
    def name(self):
        return self.info.name if self.info else ''

    @name.setter
    def name(self, value):
        self.get_info().name = value

    @property
    def avatar_url(self):
        return self.info.avatar_url if self.info else None

    @avatar_url.setter
    def avatar_url(self, value):
        self.get_info().avatar_url = value

    @property
    def wallpaper_url(self):
        return self.info.wallpaper_url if self.info else None

    @wallpaper_url.setter
    def wallpaper_url(self, value):
        self.get_info().wallpaper_url = value

    @property
    def bio(self):
        return self.info.bio if self.info else None

    @bio.setter
    def bio(self, value):
        self.get_info().bio = value

    @property
    def fitness_goal(self):
        return self.info.fitness_goal if self.info else None

    @fitness_goal.setter
    def fitness_goal(self, value):
        self.get_info().fitness_goal = value

    @property
    def target_weight(self):
        return self.info.target_weight if self.info else None

    @target_weight.setter
    def target_weight(self, value):
        self.get_info().target_weight = value

    @property
    def current_weight(self):
        return self.info.current_weight if self.info else None

    @current_weight.setter
    def current_weight(self, value):
        self.get_info().current_weight = value

    @property
    def height(self):
        return self.info.height if self.info else None

    @height.setter
    def height(self, value):
        self.get_info().height = value

    @property
    def gender(self):
        return self.info.gender if self.info else None

    @gender.setter
    def gender(self, value):
        self.get_info().gender = value

    @property
    def phone(self):
        return self.info.phone if self.info else None

    @phone.setter
    def phone(self, value):
        self.get_info().phone = value

    @property
    def age(self):
        return self.info.age if self.info else None

    @age.setter
    def age(self, value):
        self.get_info().age = value

    @property
    def experience_level(self):
        return self.info.experience_level if self.info else None

    @experience_level.setter
    def experience_level(self, value):
        self.get_info().experience_level = value

    @property
    def workout_split(self):
        return self.info.workout_split if self.info else None

    @workout_split.setter
    def workout_split(self, value):
        self.get_info().workout_split = value

    @property
    def body_fat(self):
        return self.info.body_fat if self.info else None

    @body_fat.setter
    def body_fat(self, value):
        self.get_info().body_fat = value

    @property
    def rhr(self):
        return self.info.rhr if self.info else None

    @rhr.setter
    def rhr(self, value):
        self.get_info().rhr = value

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        created_at_iso = None
        if self.created_at:
            dt = self.created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            created_at_iso = dt.isoformat()

        info = self.info or UserInfo()

        return {
            'id': str(self.id),
            'email': self.email,
            'role': self.role,
            'isVerified': self.is_verified,
            'createdAt': created_at_iso,
            'name': info.name or '',
            'avatarUrl': info.avatar_url,
            'wallpaperUrl': info.wallpaper_url,
            'bio': info.bio,
            'fitnessGoal': info.fitness_goal,
            'targetWeight': info.target_weight,
            'currentWeight': info.current_weight,
            'height': info.height,
            'gender': info.gender,
            'phone': info.phone,
            'age': info.age,
            'experienceLevel': info.experience_level,
            'workoutSplit': info.workout_split,
            'bodyFat': info.body_fat,
            'rhr': info.rhr
        }


class UserInfo(db.Model):
    """
    Stores non-auth user profile and body/fitness metrics.
    """
    __tablename__ = 'user_info'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, default='')
    avatar_url = db.Column(db.String(500), nullable=True)
    wallpaper_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.String(255), nullable=True)
    fitness_goal = db.Column(db.String(100), nullable=True, default='Lose Weight')
    target_weight = db.Column(db.Float, nullable=True)
    current_weight = db.Column(db.Float, nullable=True)
    height = db.Column(db.Float, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    age = db.Column(db.Integer, nullable=True, default=25)
    experience_level = db.Column(db.String(50), nullable=True, default='Intermediate (2-3 yrs)')
    workout_split = db.Column(db.String(50), nullable=True, default='Push / Pull / Legs')
    body_fat = db.Column(db.Float, nullable=True, default=14.5)
    rhr = db.Column(db.Integer, nullable=True, default=58)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': str(self.user_id),
            'name': self.name,
            'avatarUrl': self.avatar_url,
            'wallpaperUrl': self.wallpaper_url,
            'bio': self.bio,
            'fitnessGoal': self.fitness_goal,
            'targetWeight': self.target_weight,
            'currentWeight': self.current_weight,
            'height': self.height,
            'gender': self.gender,
            'phone': self.phone,
            'age': self.age,
            'experienceLevel': self.experience_level,
            'workoutSplit': self.workout_split,
            'bodyFat': self.body_fat,
            'rhr': self.rhr
        }


# ==========================================
# Specialized Health & Fitness Log Models
# ==========================================

class HeartRateLog(db.Model):
    """
    Heart Rate tracking entries for graphs, tables, and resting heart rate monitoring.
    """
    __tablename__ = 'heart_rate_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    bpm = db.Column(db.Integer, nullable=False)
    resting_bpm = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(50), nullable=True, default='Normal')  # 'Resting', 'Normal', 'Cardio', 'Peak'
    time_label = db.Column(db.String(50), nullable=True)  # e.g. '08:30 AM', '12:00 PM'
    recorded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        rec_iso = None
        if self.recorded_at:
            dt = self.recorded_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            rec_iso = dt.isoformat()

        return {
            'id': self.id,
            'userId': str(self.user_id),
            'bpm': self.bpm,
            'restingBpm': self.resting_bpm,
            'status': self.status,
            'timeLabel': self.time_label,
            'recordedAt': rec_iso
        }


class SleepLog(db.Model):
    """
    Sleep tracking entries including duration, sleep score/quality, and sleep cycles.
    """
    __tablename__ = 'sleep_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, nullable=False)  # e.g., 443 min = 7h 23m
    sleep_quality = db.Column(db.Float, nullable=True, default=85.0)  # percentage
    deep_sleep_minutes = db.Column(db.Integer, nullable=True)
    rem_sleep_minutes = db.Column(db.Integer, nullable=True)
    light_sleep_minutes = db.Column(db.Integer, nullable=True)
    time_label = db.Column(db.String(50), nullable=True)  # e.g. 'Mon', '2026-09-06'
    sleep_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        hours = self.duration_minutes // 60
        mins = self.duration_minutes % 60
        return {
            'id': self.id,
            'userId': str(self.user_id),
            'durationMinutes': self.duration_minutes,
            'durationDisplay': f"{hours} h {mins} m",
            'sleepQuality': self.sleep_quality,
            'deepSleepMinutes': self.deep_sleep_minutes,
            'remSleepMinutes': self.rem_sleep_minutes,
            'lightSleepMinutes': self.light_sleep_minutes,
            'timeLabel': self.time_label
        }


class StepLog(db.Model):
    """
    Daily and periodic pedometer step tracking entries.
    """
    __tablename__ = 'step_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    steps = db.Column(db.Integer, nullable=False, default=0)
    target_steps = db.Column(db.Integer, default=10000)
    distance_km = db.Column(db.Float, nullable=True, default=0.0)
    calories_burned = db.Column(db.Float, nullable=True, default=0.0)
    period = db.Column(db.String(20), default='day')  # 'day', 'week', 'month'
    time_label = db.Column(db.String(50), nullable=False)  # e.g. 'Mon', 'Today'
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'userId': str(self.user_id),
            'steps': self.steps,
            'targetSteps': self.target_steps,
            'distanceKm': self.distance_km,
            'caloriesBurned': self.calories_burned,
            'period': self.period,
            'timeLabel': self.time_label
        }


class WorkoutLog(db.Model):
    """
    Exercise sessions and workout tracking entries.
    """
    __tablename__ = 'workout_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    workout_name = db.Column(db.String(100), nullable=False)  # 'Push Workout', 'Leg Day', 'Cardio Run'
    duration_minutes = db.Column(db.Integer, nullable=False, default=45)
    calories_burned = db.Column(db.Float, nullable=False, default=350.0)
    muscle_group = db.Column(db.String(100), nullable=True)  # 'Chest, Shoulders', 'Legs', etc.
    intensity = db.Column(db.String(20), nullable=True, default='Medium')  # 'Low', 'Medium', 'High'
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        created_at_iso = None
        if self.created_at:
            dt = self.created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            created_at_iso = dt.isoformat()

        return {
            'id': self.id,
            'userId': str(self.user_id),
            'workoutName': self.workout_name,
            'durationMinutes': self.duration_minutes,
            'caloriesBurned': self.calories_burned,
            'muscleGroup': self.muscle_group,
            'intensity': self.intensity,
            'notes': self.notes,
            'createdAt': created_at_iso
        }


class FoodIntakeLog(db.Model):
    """
    Nutrition and calorie/macro intake tracking entries.
    """
    __tablename__ = 'food_intake_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    meal_type = db.Column(db.String(30), nullable=False)  # 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    food_name = db.Column(db.String(150), nullable=False)
    calories = db.Column(db.Float, nullable=False, default=0.0)
    protein = db.Column(db.Float, nullable=True, default=0.0)
    carbs = db.Column(db.Float, nullable=True, default=0.0)
    fat = db.Column(db.Float, nullable=True, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        created_at_iso = None
        if self.created_at:
            dt = self.created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            created_at_iso = dt.isoformat()

        return {
            'id': self.id,
            'userId': str(self.user_id),
            'mealType': self.meal_type,
            'foodName': self.food_name,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'createdAt': created_at_iso
        }


# ==========================================
# Legacy Models (Maintained for Compatibility)
# ==========================================

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    period = db.Column(db.String(20), nullable=False)  # 'day', 'week', 'month'
    time_label = db.Column(db.String(50), nullable=False)  # e.g. '6AM', 'Mon', 'W1'
    calories = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'time': self.time_label,
            'cal': self.calories
        }


class WeightLog(db.Model):
    __tablename__ = 'weight_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    month_label = db.Column(db.String(50), nullable=False)  # e.g. 'Jan', 'Feb', 'Mar'
    weight = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            'month': self.month_label,
            'weight': self.weight
        }
