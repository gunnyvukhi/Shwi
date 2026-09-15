# pyright: reportGeneralTypeIssues=false
# pyright: reportAttributeAccessIssue=false
# pyright: reportAssignmentType=false
# pyright: reportCallIssue=false
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, datetime, timedelta, timezone
db = SQLAlchemy()

class User(db.Model):
    """
    Core User model focusing strictly on authentication, credentials, roles, and security tokens.
    """
    __tablename__ = 'users'
    __allow_unmapped__ = True

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
    sleep_logs = db.relationship('SleepLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    step_logs = db.relationship('StepLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    workout_plans = db.relationship('WorkoutPlan', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    workout_logs = db.relationship('WorkoutLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    meal_logs = db.relationship('MealLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    body_condition_logs = db.relationship('BodyConditionLog', backref='user', cascade='all, delete-orphan', lazy='dynamic')
    ### WORKOUT -> chỉ gym, ACTIVITY là tất cả các hoạt động khác như chạy bộ, đạp xe, bơi lội
    ### FOOD -> cần lưu macro đẩy đủ từ các vi chất quan trọng (hiện tại chỉ lưu Carb, Protein, Fat)
    ### BODY -> Hiện tại chỉ đang lưu chiều cao cân nặng, có thể mở rộng thêm số đo các bộ phận khác trong tương lai

    def __init__(self, **kwargs):
        # Extract profile attributes passed during registration (direct, Google, Apple)
        name = kwargs.pop('name', '')
        avatar_url = kwargs.pop('avatar_url', None)

        super().__init__(**kwargs)
        self._legacy_name = name or ''

        # Automatically attach associated UserInfo profile
        if not self.info:
            self.info = UserInfo(name=name or 'NPC', avatar_url=avatar_url)
        else:
            if name:
                self.info.name = name
            if avatar_url:
                self.info.avatar_url = avatar_url

    def get_info(self):
        """Helper to ensure UserInfo instance is always available."""
        if not self.info:
            self.info = UserInfo()
        return self.info

    # Password Methods
    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    # Identity Properties
    @property
    def name(self):
        return self.get_info().name or 'NPC'

    @name.setter
    def name(self, value):
        self.get_info().name = value

    @property
    def avatar_url(self):
        return self.get_info().avatar_url or None

    @avatar_url.setter
    def avatar_url(self, value):
        self.get_info().avatar_url = value

    # Dynamic Body Metrics (latest entry from BodyConditionLog)
    @property
    def latest_body_condition(self):
        try:
            if not hasattr(self, 'body_condition_logs'):
                return {}
            record = self.body_condition_logs.order_by(
                BodyConditionLog.date.desc(),
                BodyConditionLog.created_at.desc(),
                BodyConditionLog.id.desc()
            ).first()
            return record.to_dict() if record is not None else {}
        except Exception:
            return {}

    def get_monthly_weight_history(self):
        if not hasattr(self, 'body_condition_logs'):
            return []

        now = datetime.now(timezone.utc)
        today = now.date()

        # Build list of the last 6 consecutive months up to current month (e.g., 5 months ago -> today)
        base_idx = today.year * 12 + today.month - 1
        target_months = []
        for offset in range(5, -1, -1):
            idx = base_idx - offset
            target_months.append((idx // 12, idx % 12 + 1))

        start_date = date(target_months[0][0], target_months[0][1], 1)

        # 1. Project ONLY needed columns (date, weight) using with_entities to avoid heavy ORM model instantiation.
        # 2. Order by (date.desc(), id.desc()) matching composite index (user_id, date) + InnoDB PK to avoid filesort.
        logs = self.body_condition_logs.with_entities(
            BodyConditionLog.date,
            BodyConditionLog.weight
        ).filter(
            BodyConditionLog.date >= start_date,
            BodyConditionLog.date <= today
        ).order_by(
            BodyConditionLog.date.desc(),
            BodyConditionLog.id.desc()
        ).all()

        # Map each month to its latest recorded weight (since logs are ordered newest first, the 1st match per month is the latest)
        month_to_weight = {}
        for log_date, log_weight in logs:
            if log_date:
                key = (log_date.year, log_date.month)
                if key not in month_to_weight:
                    month_to_weight[key] = round(float(log_weight), 1)

        # Determine baseline weight for the first month if it has no logs recorded
        last_weight = None
        if target_months[0] not in month_to_weight:
            prior_log = self.body_condition_logs.with_entities(
                BodyConditionLog.weight
            ).filter(
                BodyConditionLog.date < start_date
            ).order_by(
                BodyConditionLog.date.desc(),
                BodyConditionLog.id.desc()
            ).first()
            if prior_log and prior_log[0] is not None:
                last_weight = round(float(prior_log[0]), 1)
            elif month_to_weight:
                # If no prior logs exist, backfill initial months with the earliest recorded weight in the window
                for y, m in target_months:
                    if (y, m) in month_to_weight:
                        last_weight = month_to_weight[(y, m)]
                        break

        # If user has never logged any weight, return empty list
        if last_weight is None and not month_to_weight:
            return []

        # Construct 6-month list, carrying forward previous month's weight if a month has no log
        result = []
        for y, m in target_months:
            key = (y, m)
            if key in month_to_weight:
                last_weight = month_to_weight[key]

            if last_weight is not None:
                result.append({
                    'month': f"{m:02d}/{str(y)[-2:]}",
                    'weight': last_weight
                })

        return result
    
            
    def get_today_sleep_logs(self):
        """
        Gather all sleep logs of today's sleep cycle (8:00 PM yesterday to 8:00 PM today),
        sum all sleep durations, and aggregate metrics into a single summary log.
        """
        try:
            if not hasattr(self, 'sleep_logs'):
                return {}

            now = datetime.now(timezone.utc)
            today = now.date()
            yesterday = today - timedelta(days=1)

            # Define time window: 8:00 PM yesterday -> 8:00 PM today
            start_naive = datetime(yesterday.year, yesterday.month, yesterday.day, 20, 0, 0)
            end_naive = datetime(today.year, today.month, today.day, 20, 0, 0)
            start_utc = start_naive.replace(tzinfo=timezone.utc)
            end_utc = end_naive.replace(tzinfo=timezone.utc)

            sleep_time_col = db.func.coalesce(SleepLog.sleep_date, SleepLog.created_at)

            logs = self.sleep_logs.filter(
                db.or_(
                    db.and_(sleep_time_col >= start_naive, sleep_time_col <= end_naive),
                    db.and_(sleep_time_col >= start_utc, sleep_time_col <= end_utc)
                )
            ).order_by(sleep_time_col.asc()).all()

            if not logs:
                return {}

            total_duration = sum(log.duration_minutes or 0 for log in logs)

            # Sum sleep stages and metrics
            deep_vals = [l.deep_sleep_minutes for l in logs if l.deep_sleep_minutes is not None]
            rem_vals = [l.rem_sleep_minutes for l in logs if l.rem_sleep_minutes is not None]
            light_vals = [l.light_sleep_minutes for l in logs if l.light_sleep_minutes is not None]
            latency_vals = [l.sleep_latency_minutes for l in logs if l.sleep_latency_minutes is not None]
            waso_vals = [l.waso_minutes for l in logs if l.waso_minutes is not None]

            total_deep = sum(deep_vals) if deep_vals else None
            total_rem = sum(rem_vals) if rem_vals else None
            total_light = sum(light_vals) if light_vals else None
            total_latency = sum(latency_vals) if latency_vals else None
            total_waso = sum(waso_vals) if waso_vals else None

            # Calculate Sleep Efficiency: Total Sleep Time / Total Time in Bed
            # Time in Bed = duration_minutes + sleep_latency_minutes + waso_minutes
            time_in_bed = total_duration + (total_latency or 0) + (total_waso or 0)
            if time_in_bed > 0 and total_duration > 0:
                sleep_efficiency = round((total_duration / time_in_bed) * 100.0, 1)
            else:
                sleep_efficiency = 0.0

            hours = total_duration // 60
            mins = total_duration % 60

            return {
                'id': logs[-1].id if logs else None,
                'durationDisplay': f"{hours}h {mins}m",
                'sleepEfficiency': sleep_efficiency,
                'sleepLatencyMinutes': total_latency,
                'wasoMinutes': total_waso,
                'deepSleepMinutes': total_deep,
                'remSleepMinutes': total_rem,
                'lightSleepMinutes': total_light,
                'timeLabel': 'Today',
                'logCount': len(logs)
            }
        except Exception:
            return {}
    
    def get_today_steps_breakdown(self, target_date=None):
        """
        Lấy thông tin bước chân của một ngày cụ thể (mặc định là hôm nay).
        những khung giờ chưa có dữ liệu sẽ có steps = 0.
        """
        try:
            if not target_date:
                target_date = datetime.now(timezone.utc).date()

            # Lấy tất cả các log bước chân của user trong ngày này
            logs = self.step_logs.filter(StepLog.date == target_date).all()
            logs_by_label = {log.time_label: log for log in logs}

            intervals = []
            total_steps = 0
            total_distance = 0.0
            total_minutes = 0

            for label in StepLog.STANDARD_INTERVALS:
                log = logs_by_label.get(label)
                step_val = log.steps if log else 0
                dist_val = log.distance_km if log else 0.0
                mins_val = log.time_walked_minutes if log else 0

                total_steps += step_val
                total_distance += dist_val
                total_minutes += mins_val

                intervals.append({
                    'timeLabel': label,
                    'steps': step_val,
                    'distanceKm': round(dist_val, 2),
                    'timeWalkedMinutes': mins_val
                })

            return {
                'date': target_date.isoformat(),
                'totalSteps': total_steps,
                'totalDistanceKm': round(total_distance, 2),
                'totalWalkedMinutes': total_minutes,
                'intervals': intervals  # 6 phần tử tương ứng 6AM, 9AM, 12PM, 3PM, 6PM, 9PM
            }
        except Exception:
            return {
                'date': target_date.isoformat() if target_date else '',
                'totalSteps': 0,
                'totalDistanceKm': 0.0,
                'totalWalkedMinutes': 0,
                'intervals': [{'timeLabel': lbl, 'steps': 0, 'distanceKm': 0.0, 'timeWalkedMinutes': 0} for lbl in StepLog.STANDARD_INTERVALS]
            }

    def get_this_week_workout_logs(self):
        """
        Lấy thông tin các buổi tập từ đầu tuần (thứ 2) đến hôm nay dưới dạng dict.
        Key là thứ trong tuần (Monday, Tuesday, ...), Value là dict {'name': ..., 'time': ...}.
        """
        try:
            if not hasattr(self, 'workout_logs'):
                return {}

            now = datetime.now(timezone.utc)
            today = now.date()
            # start_of_week là Thứ 2 (weekday 0)
            start_of_week = today - timedelta(days=today.weekday())

            start_naive = datetime(start_of_week.year, start_of_week.month, start_of_week.day, 0, 0, 0)
            end_naive = datetime(today.year, today.month, today.day, 23, 59, 59, 999999)
            start_utc = start_naive.replace(tzinfo=timezone.utc)
            end_utc = end_naive.replace(tzinfo=timezone.utc)

            logs = self.workout_logs.filter(
                db.or_(
                    db.and_(WorkoutLog.created_at >= start_naive, WorkoutLog.created_at <= end_naive),
                    db.and_(WorkoutLog.created_at >= start_utc, WorkoutLog.created_at <= end_utc)
                )
            ).order_by(WorkoutLog.created_at.asc(), WorkoutLog.id.asc()).all()

            if not logs:
                return {}

            # Nhóm logs theo ngày
            logs_by_date = {}
            for log in logs:
                dt = log.created_at
                if not dt:
                    continue
                d = dt.date() if hasattr(dt, 'date') else dt
                if d not in logs_by_date:
                    logs_by_date[d] = []
                logs_by_date[d].append(log)

            result = {}

            curr = start_of_week
            while curr <= today:
                if curr in logs_by_date:
                    day_logs = logs_by_date[curr]
                    day_name = curr.strftime('%A')

                    # Ghép tên các buổi tập trong ngày
                    names = [l.workout_name for l in day_logs if l.workout_name]
                    combined_names = " + ".join(names) if names else "Workout"

                    # Tính tổng thời gian tập trong ngày
                    total_minutes = sum(l.duration_minutes or 0 for l in day_logs)
                    hours = total_minutes // 60
                    mins = total_minutes % 60
                    duration_str = f"{hours}h{mins}m"

                    result[day_name] = {
                        'name': combined_names,
                        'time': duration_str
                    }
                curr += timedelta(days=1)

            return result
        except Exception:
            return {}

    def get_today_nutrition(self, target_date=None):
        """
        Tổng hợp dinh dưỡng của một ngày cụ thể (mặc định là hôm nay):
        tổng calories, protein, carbs, fat và danh sách các bữa ăn trong ngày.
        """
        try:
            if not target_date:
                target_date = datetime.now(timezone.utc).date()

            # Xác định khoảng thời gian cả ngày target_date
            start_naive = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
            end_naive = datetime(target_date.year, target_date.month, target_date.day, 23, 59, 59, 999999)
            start_utc = start_naive.replace(tzinfo=timezone.utc)
            end_utc = end_naive.replace(tzinfo=timezone.utc)

            logs = self.meal_logs.filter(
                db.or_(
                    db.and_(MealLog.datetime_eaten >= start_naive, MealLog.datetime_eaten <= end_naive),
                    db.and_(MealLog.datetime_eaten >= start_utc, MealLog.datetime_eaten <= end_utc)
                )
            ).order_by(MealLog.datetime_eaten.asc(), MealLog.id.asc()).all()

            total_calories = sum(l.calories or 0.0 for l in logs)
            total_protein = sum(l.protein or 0.0 for l in logs)
            total_carbs = sum(l.carbs or 0.0 for l in logs)
            total_fat = sum(l.fat or 0.0 for l in logs)

            return {
                'date': target_date.isoformat(),
                'calories': round(total_calories, 1),
                'protein': round(total_protein, 1),
                'carbs': round(total_carbs, 1),
                'fat': round(total_fat, 1),
                'mealCount': len(logs),
                'meals': [item.to_dict() for item in logs]
            }
        except Exception:
            return {
                'date': target_date.isoformat() if target_date else '',
                'calories': 0.0,
                'protein': 0.0,
                'carbs': 0.0,
                'fat': 0.0,
                'mealCount': 0,
                'meals': []
            }

    def to_dict(self):
        """
        Basic user dictionary containing core account information.
        """
        created_at_iso = None
        if self.created_at:
            dt = self.created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            created_at_iso = dt.isoformat()

        return {
            'id': str(self.id),
            'email': self.email,
            'role': self.role,
            'isVerified': self.is_verified,
            'createdAt': created_at_iso
        }

    def get_full_data(self):
        """
        Pull all non-sensitive user profile, metrics, and health logs at once.
        """
        return {
            'id': str(self.id),
            'profile': {
                'email': self.email,
                'role': self.role,
                **self.get_info().to_dict()
            },
            'metrics': {
                'weight': None,
                'height': None,
                'bmi': None,
                'bodyFat': None,
                'muscleMass': None,
                **self.latest_body_condition,
            },
            'sleep': self.get_today_sleep_logs(),
            'steps': self.get_today_steps_breakdown(),
            'workoutLogs': self.get_this_week_workout_logs(),
            'nutrition': self.get_today_nutrition(),
            'weightHistory': self.get_monthly_weight_history(),
        }



class UserInfo(db.Model):
    """
    Stores non-auth user profile.
    Physical body condition metrics (current weight, height, body fat) are tracked in BodyConditionLog.
    """
    __tablename__ = 'user_info'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False, default='NPC')
    avatar_url = db.Column(db.String(500), nullable=True)
    wallpaper_url = db.Column(db.String(500), nullable=True)
    bio = db.Column(db.String(255), nullable=True)
    fitness_goal = db.Column(db.Integer, nullable=True, default=0)  # 0: lose weight, 1: gain weight
    target_weight = db.Column(db.Float, nullable=True) # In kilogram
    target_steps = db.Column(db.Integer, nullable=True, default=10000) # Daily step goal
    gender = db.Column(db.Integer, nullable=True, default=0)  # 0: Male, 1: Female
    phone = db.Column(db.String(20), nullable=True)
    yob = db.Column(db.Integer, nullable=True, default=2000)  # Year of Birth
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def age(self):
        if self.yob:
            return datetime.now(timezone.utc).year - self.yob
        return None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    def to_dict(self):
        return {
            'name': self.name,
            'avatarUrl': self.avatar_url,
            'wallpaperUrl': self.wallpaper_url,
            'bio': self.bio,
            'fitnessGoal': self.fitness_goal,
            'targetWeight': self.target_weight,
            'targetSteps': self.target_steps,
            'gender': self.gender,
            'phone': self.phone,
            'age': self.age
        }

class BodyConditionLog(db.Model):
    """
    Body Condition & physical metrics tracking entries.
    Currently tracks height and weight, with room for future body metrics (body fat %, muscle mass, circumferences, etc.).
    """
    __tablename__ = 'body_condition_logs'

    __table_args__ = (
        db.Index('idx_bcl_user_date', 'user_id', 'date'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    weight = db.Column(db.Float, nullable=False, default=0.0)      # Cân nặng (kg)
    height = db.Column(db.Float, nullable=True)                    # Chiều cao (cm)
    bmi = db.Column(db.Float, nullable=True)                       # Chỉ số BMI

    # Mở rộng trong tương lai (Future extensions):
    body_fat = db.Column(db.Float, nullable=True)                  # % Mỡ cơ thể
    muscle_mass = db.Column(db.Float, nullable=True)               # Khối lượng cơ (kg)

    date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date(), index=True) # Ngày đạt trạng thái thể chất này
    logged_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def compute_bmi(self) -> float | None:
        """Helper to calculate BMI from weight (kg) and height (cm)."""
        if self.weight and self.height:
            try:
                w = float(self.weight)
                h_m = float(self.height) / 100.0
                if h_m > 0 and w > 0:
                    return round(w / (h_m * h_m), 1)
            except (ValueError, TypeError, ZeroDivisionError):
                pass
        return None

    def __init__(self, **kwargs):
        kwargs.pop('month_label', None)
        kwargs.pop('monthLabel', None)

        # Sanitize and cast numeric fields
        for field in ['weight', 'height', 'body_fat', 'muscle_mass', 'bmi']:
            if field in kwargs and kwargs[field] is not None:
                try:
                    kwargs[field] = float(kwargs[field])
                except (ValueError, TypeError):
                    kwargs[field] = None

        # Parse date if provided (supports string YYYY-MM-DD or date/datetime)
        input_date = kwargs.pop('date', None)
        if input_date:
            if isinstance(input_date, str):
                try:
                    clean_str = input_date.split('T')[0].strip()
                    kwargs['date'] = datetime.strptime(clean_str, '%Y-%m-%d').date()
                except Exception:
                    kwargs['date'] = datetime.now(timezone.utc).date()
            elif isinstance(input_date, datetime):
                kwargs['date'] = input_date.date()
            elif isinstance(input_date, date):
                kwargs['date'] = input_date
        elif 'logged_at' in kwargs and kwargs['logged_at']:
            l_at = kwargs['logged_at']
            if isinstance(l_at, datetime):
                kwargs['date'] = l_at.date()

        super().__init__(**kwargs)
        if self.date is None:
            self.date = datetime.now(timezone.utc).date()

        if self.bmi is None:
            self.bmi = self.compute_bmi()

    def to_dict(self):
        created_iso = None
        if self.created_at:
            dt = self.created_at
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            created_iso = dt.isoformat()

        calculated_bmi = self.bmi if self.bmi is not None else self.compute_bmi()
        record_date = self.date or (self.created_at.date() if self.created_at else None)

        return {
            'weight': self.weight,
            'height': self.height,
            'bmi': calculated_bmi,
            'bodyFat': self.body_fat,
            'muscleMass': self.muscle_mass,
            'date': record_date.isoformat() if record_date else None,
            'loggedAt': created_iso,
            'createdAt': created_iso
        }

    def __repr__(self):
        return f"<BodyConditionLog user={self.user_id} date={self.date} weight={self.weight}kg>"

# ==========================================
# Specialized Health & Fitness Log Models
# ==========================================

class WorkoutPlan(db.Model):
    __tablename__ = 'workout_plans'
    __allow_unmapped__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)  # Ví dụ: 'Push Pull Legs', '3 Day Split'
    priority = db.Column(db.Integer, nullable=False, default=1) # Thứ tự hiển thị
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # 1 WorkoutPlan có nhiều WorkoutLog
    workout_logs = db.relationship('WorkoutLog', backref='workout_plan', lazy='dynamic')
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
            'name': self.name,
            'priority': self.priority,
            'note': self.note,
            'createdAt': created_at_iso
        }

class WorkoutLog(db.Model):
    """
    Exercise sessions and workout tracking entries.
    """
    __tablename__ = 'workout_logs'
    __allow_unmapped__ = True

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    plan_id = db.Column(db.Integer, db.ForeignKey('workout_plans.id', ondelete='CASCADE'), nullable=True, index=True)
    workout_name = db.Column(db.String(100), nullable=False)  # 'Push Workout', 'Leg Day', 'Cardio Run'
    duration_minutes = db.Column(db.Integer, nullable=False, default=45)
    note = db.Column(db.Text, nullable=True)
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
            'planId': str(self.plan_id) if self.plan_id else None,
            'workoutName': self.workout_name,
            'durationMinutes': self.duration_minutes,
            'note': self.note,
            'createdAt': created_at_iso
        }

class StepLog(db.Model):
    """
    Theo dõi bước chân tích lũy theo từng khung giờ trong ngày (Cách 2).
    Mỗi user trong 1 ngày chỉ có tối đa 6 bản ghi tương ứng 6 khung giờ: 6AM, 9AM, 12PM, 3PM, 6PM, 9PM.
    """
    __tablename__ = 'step_logs'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'date', 'time_label', name='uq_user_step_date_label'),
    )

    STANDARD_INTERVALS = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM']

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    date = db.Column(db.Date, nullable=False, default=lambda: datetime.now(timezone.utc).date(), index=True)
    time_label = db.Column(db.String(10), nullable=False, default='6AM', index=True)
    
    steps = db.Column(db.Integer, nullable=False, default=0)
    distance_km = db.Column(db.Float, nullable=True, default=0.0)
    time_walked_minutes = db.Column(db.Integer, nullable=True, default=0)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @staticmethod
    def determine_time_label(hour: int) -> str:
        """
        Ánh xạ giờ trong ngày (0-23) sang nhãn khung giờ:
        - 00:00 -> 05:59: '6AM'
        - 06:00 -> 08:59: '9AM'
        - 09:00 -> 11:59: '12PM'
        - 12:00 -> 14:59: '3PM'
        - 15:00 -> 17:59: '6PM'
        - 18:00 -> 23:59: '9PM'
        """
        if 0 <= hour < 6:
            return '6AM'
        elif 6 <= hour < 9:
            return '9AM'
        elif 9 <= hour < 12:
            return '12PM'
        elif 12 <= hour < 15:
            return '3PM'
        elif 15 <= hour < 18:
            return '6PM'
        else:
            return '9PM'

    def to_dict(self):
        return {
            'id': self.id,
            'userId': str(self.user_id),
            'date': self.date.isoformat() if self.date else None,
            'timeLabel': self.time_label,
            'steps': self.steps,
            'distanceKm': round(self.distance_km or 0.0, 2),
            'timeWalkedMinutes': self.time_walked_minutes or 0,
        }


class SleepLog(db.Model):
    """
    Sleep tracking entries including duration, sleep score/quality, and sleep cycles.
    """
    __tablename__ = 'sleep_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    duration_minutes = db.Column(db.Integer, nullable=False)  # e.g., 443 min = 7h 23m
    sleep_latency_minutes = db.Column(db.Integer, nullable=True)  # thời gian đi vào giấc ngủ
    waso_minutes = db.Column(db.Integer, nullable=True)  # wake after sleep onset/ Số lần thức giấc
    deep_sleep_minutes = db.Column(db.Integer, nullable=True)
    rem_sleep_minutes = db.Column(db.Integer, nullable=True)
    light_sleep_minutes = db.Column(db.Integer, nullable=True)
    time_label = db.Column(db.String(50), nullable=True)  # e.g. 'Mon', '2026-09-06'
    sleep_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @property
    def sleep_efficiency(self):
        dur = self.duration_minutes or 0
        lat = self.sleep_latency_minutes or 0
        waso = self.waso_minutes or 0
        tib = dur + lat + waso
        if tib > 0 and dur > 0:
            return round((dur / tib) * 100.0, 1)
        return 0.0

    def to_dict(self):
        hours = self.duration_minutes // 60
        mins = self.duration_minutes % 60
        return {
            'id': self.id,
            'userId': str(self.user_id),
            'durationMinutes': self.duration_minutes,
            'sleepEfficiency': self.sleep_efficiency,
            'sleepLatencyMinutes': self.sleep_latency_minutes,
            'wasoMinutes': self.waso_minutes,
            'deepSleepMinutes': self.deep_sleep_minutes,
            'remSleepMinutes': self.rem_sleep_minutes,
            'lightSleepMinutes': self.light_sleep_minutes,
            'timeLabel': self.time_label
        }

class MealLog(db.Model):
    """
    Nutrition and calorie/macro intake tracking entries.
    """
    __tablename__ = 'meal_logs'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    meal_name = db.Column(db.String(50), nullable=False)  # 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    calories = db.Column(db.Float, nullable=False, default=0.0)
    protein = db.Column(db.Float, nullable=True, default=0.0)
    carbs = db.Column(db.Float, nullable=True, default=0.0)
    fat = db.Column(db.Float, nullable=True, default=0.0)
    datetime_eaten = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @property
    def time_eaten(self):
        return self.datetime_eaten.strftime('%H:%M:%S')

    @property
    def date_eaten(self):
        return self.datetime_eaten.strftime('%Y-%m-%d')

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
            'mealName': self.meal_name,
            'calories': self.calories,
            'protein': self.protein,
            'carbs': self.carbs,
            'fat': self.fat,
            'timeEaten': self.time_eaten,
            'dateEaten': self.date_eaten,
            'createdAt': created_at_iso
        }


