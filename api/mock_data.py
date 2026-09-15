"""
mock_data.py
Module cung cấp các hàm tạo tài khoản test và dữ liệu ảo (mock data) thực tế
khớp 100% với database schema mới trong models.py.
"""

from datetime import date, datetime, timedelta, timezone
from models import (
    db, User, UserInfo, BodyConditionLog,
    SleepLog, StepLog, WorkoutPlan, WorkoutLog, MealLog
)
import firebase_service

def calculate_month_offset(base_date: date, offset_months: int) -> date:
    """Helper tính ngày ở n tháng trước/sau."""
    total_m = base_date.year * 12 + base_date.month - 1 + offset_months
    y = total_m // 12
    m = total_m % 12 + 1
    return date(y, m, 15)


def create_or_get_test_user(
    email: str = 'test@email.com',
    password: str = '12345@',
    name: str = 'Thang bo may'
) -> User:
    """
    Tạo hoặc lấy tài khoản người dùng test với đầy đủ thông tin profile.
    """
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            name=name,
            email=email,
            is_verified=True,
            role='user'
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"[Seed] Created new test user: {email}")
    else:
        user.is_verified = True
        user.set_password(password)
        db.session.commit()
        print(f"[Seed] Existing test user found: {email}")

    # Đảm bảo UserInfo đầy đủ
    info = user.get_info()
    info.name = name
    info.bio = "Fitness enthusiast & strength training athlete"
    info.fitness_goal = 0  # 0: lose weight
    info.target_weight = 64.0
    info.target_steps = 12000
    info.gender = 0  # 0: Male
    info.phone = "+1 555-0199"
    info.yob = 1998  # 28 years old
    db.session.commit()

    return user


def seed_mock_logs(user_id: int, clear_existing: bool = True) -> dict:
    """
    Tạo dữ liệu logs ảo đa dạng và thực tế cho một user khớp 100% với models.py:
    - BodyConditionLog: 6 tháng gần nhất có khoảng trống kiểm thử forward-fill.
    - WorkoutPlan & WorkoutLog: Kế hoạch Push Pull Legs và các buổi tập trong tuần.
    - StepLog: Chuẩn 6 khung giờ hôm nay (6AM, 9AM, 12PM, 3PM, 6PM, 9PM).
    - SleepLog: Giấc ngủ đêm qua với chi tiết các giai đoạn.
    - MealLog: 4 bữa ăn đầy đủ macros.
    - HeartRate & RestingHeartRate: Đồng bộ lên Firebase Realtime Database.
    """
    user = db.session.get(User, user_id)
    if not user:
        raise ValueError(f"Không tìm thấy user với id={user_id}")

    if clear_existing:
        BodyConditionLog.query.filter_by(user_id=user_id).delete()
        SleepLog.query.filter_by(user_id=user_id).delete()
        StepLog.query.filter_by(user_id=user_id).delete()
        WorkoutLog.query.filter_by(user_id=user_id).delete()
        WorkoutPlan.query.filter_by(user_id=user_id).delete()
        MealLog.query.filter_by(user_id=user_id).delete()
        db.session.commit()

    now = datetime.now(timezone.utc)
    today = now.date()

    # 1. BodyConditionLog (Kiểm thử 6 tháng gần nhất với forward-fill)
    d_5m = calculate_month_offset(today, -5)
    d_4m = calculate_month_offset(today, -4)
    d_2m = calculate_month_offset(today, -2)
    d_curr = today

    body_logs = [
        BodyConditionLog(user_id=user_id, weight=82.0, height=178.0, body_fat=19.5, muscle_mass=58.0, date=d_5m),
        BodyConditionLog(user_id=user_id, weight=79.5, height=178.0, body_fat=18.5, muscle_mass=58.5, date=d_4m),
        # 3 tháng trước: bỏ qua để test forward-fill
        BodyConditionLog(user_id=user_id, weight=77.0, height=178.0, body_fat=17.5, muscle_mass=59.0, date=d_2m),
        # 1 tháng trước: bỏ qua để test forward-fill
        BodyConditionLog(user_id=user_id, weight=74.2, height=178.0, body_fat=16.5, muscle_mass=60.0, date=d_curr),
    ]
    db.session.add_all(body_logs)

    # 2. WorkoutPlan & WorkoutLog
    plan1 = WorkoutPlan(
        user_id=user_id,
        name='Push Pull Legs',
        priority=1,
        note='3-day split focused on progressive overload and hypertrophy'
    )
    db.session.add(plan1)
    db.session.flush()

    plan2 = WorkoutPlan(
        user_id=user_id,
        name='Upper/Lower',
        priority=2,
        note='4-day split focused on strength'
    )
    db.session.add(plan2)
    db.session.flush()

    # Tạo các buổi tập trong tuần này (Monday -> hôm nay)
    monday = today - timedelta(days=today.weekday())
    w_logs = [
        WorkoutLog(
            user_id=user_id,
            plan_id=plan1.id,
            workout_name='Push Day',
            duration_minutes=60,
            note='Barbell Bench Press 4x8, OHP 3x10, Tricep Dips 3x12',
            created_at=datetime(monday.year, monday.month, monday.day, 17, 30, tzinfo=timezone.utc)
        ),
        WorkoutLog(
            user_id=user_id,
            plan_id=plan1.id,
            workout_name='Pull Day (Back, Biceps, Rear Delts)',
            duration_minutes=65,
            note='Deadlifts 3x5, Lat Pulldown 4x10, Barbell Curls 3x12',
            created_at=datetime(monday.year, monday.month, monday.day, 17, 30, tzinfo=timezone.utc) + timedelta(days=2)
        ),
        WorkoutLog(
            user_id=user_id,
            plan_id=plan2.id,
            workout_name='Upper Day',
            duration_minutes=45,
            note='Bench Press, Lat Pulldown, Lateral Raises',
            created_at=datetime(monday.year, monday.month, monday.day, 17, 30, tzinfo=timezone.utc) + timedelta(days=2)
        ),
        WorkoutLog(
            user_id=user_id,
            plan_id=plan2.id,
            workout_name='Lower Day',
            duration_minutes=45,
            note='Squats, Deadlifts, Leg Extensions',
            created_at=datetime(monday.year, monday.month, monday.day, 17, 30, tzinfo=timezone.utc) + timedelta(days=1)
        )
    ]
    db.session.add_all(w_logs)

    # 3. StepLog (Đầy đủ 6 khung giờ hôm nay theo STANDARD_INTERVALS)
    step_intervals_data = [
        ('6AM', 1200, 0.9, 12),
        ('9AM', 3450, 2.6, 35),
        ('12PM', 5800, 4.35, 58),
        ('3PM', 7900, 5.92, 80),
        ('6PM', 10400, 7.8, 105),
        ('9PM', 2350, 1.8, 25)
    ]
    for label, steps, dist, mins in step_intervals_data:
        db.session.add(StepLog(
            user_id=user_id,
            date=today,
            time_label=label,
            steps=steps,
            distance_km=dist,
            time_walked_minutes=mins
        ))

    # 4. HeartRate (Cập nhật nhịp tim lên Firebase RTDB)
    firebase_service.save_heart_rate(user_id=user_id, bpm=90, recorded_at=now)

    # 5. RestingHeartRate (Cập nhật nhịp tim nghỉ ngơi lên Firebase RTDB)
    firebase_service.save_resting_heart_rate(user_id=user_id, bpm=62, recorded_at=now)

    # 6. SleepLog (Chu kỳ ngủ đêm qua: 8PM hôm qua -> 8AM hôm nay)
    yesterday = today - timedelta(days=1)
    sleep_dt = datetime(today.year, today.month, today.day, 7, 0, tzinfo=timezone.utc)
    db.session.add(SleepLog(
        user_id=user_id,
        duration_minutes=465,  # 7h 45m
        sleep_latency_minutes=15,
        waso_minutes=20,
        deep_sleep_minutes=105,
        rem_sleep_minutes=115,
        light_sleep_minutes=245,
        time_label='Today',
        sleep_date=sleep_dt
    ))

    # 7. MealLog (4 bữa ăn hôm nay)
    meals_data = [
        ('Breakfast', 480.0, 36.0, 62.0, 9.0, datetime(today.year, today.month, today.day, 7, 30, tzinfo=timezone.utc)),
        ('Lunch', 650.0, 45.0, 52.0, 22.0, datetime(today.year, today.month, today.day, 12, 15, tzinfo=timezone.utc)),
        ('Snack', 250.0, 22.0, 18.0, 8.0, datetime(today.year, today.month, today.day, 16, 0, tzinfo=timezone.utc)),
        ('Dinner', 580.0, 50.0, 48.0, 12.0, datetime(today.year, today.month, today.day, 19, 45, tzinfo=timezone.utc))
    ]
    for m_name, cal, p, c, f, dt_eat in meals_data:
        db.session.add(MealLog(
            user_id=user_id,
            meal_name=m_name,
            calories=cal,
            protein=p,
            carbs=c,
            fat=f,
            datetime_eaten=dt_eat
        ))

    db.session.commit()

    return {
        'bodyConditionLogs': len(body_logs),
        'workoutPlans': 1,
        'workoutLogs': len(w_logs),
        'stepLogs': len(step_intervals_data),
        'heartRateUpdated': True,
        'restingHeartRateUpdated': True,
        'sleepLogs': 1,
        'mealLogs': len(meals_data)
    }
