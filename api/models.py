from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)
    otp_purpose = db.Column(db.String(30), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    apple_id = db.Column(db.String(255), unique=True, nullable=True)
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
    reset_token = db.Column(db.String(255), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

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

        return {
            'id': str(self.id),
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'isVerified': self.is_verified,
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
            'rhr': self.rhr,
            'createdAt': created_at_iso
        }


class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    period = db.Column(db.String(20), nullable=False)  # 'day', 'week', 'month'
    time_label = db.Column(db.String(50), nullable=False)  # e.g. '6AM', 'Mon', 'W1'
    calories = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'time': self.time_label,
            'cal': self.calories
        }


class WeightLog(db.Model):
    __tablename__ = 'weight_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    month_label = db.Column(db.String(50), nullable=False)  # e.g. 'Jan', 'Feb', 'Mar'
    weight = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'month': self.month_label,
            'weight': self.weight
        }

