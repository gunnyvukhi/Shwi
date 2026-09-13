import unittest
from datetime import date, datetime, timedelta, timezone
from flask import Flask

from models import (
    db, User, UserInfo, BodyConditionLog, HeartRateLog, RestingHeartRateLog,
    SleepLog, StepLog, WorkoutPlan, WorkoutLog, MealLog
)

class TestModels(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app.config['SECRET_KEY'] = 'test-secret-key'
        db.init_app(self.app)

        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_user_password_and_info(self):
        user = User(email='alex@shwi.com', name='Alex', role='user')
        user.set_password('SecretPass123')
        db.session.add(user)
        db.session.commit()

        self.assertTrue(user.check_password('SecretPass123'))
        self.assertFalse(user.check_password('WrongPass'))
        self.assertEqual(user.name, 'Alex')
        self.assertIsNotNone(user.get_info())

        user_dict = user.to_dict()
        self.assertEqual(user_dict['email'], 'alex@shwi.com')
        self.assertEqual(user_dict['role'], 'user')

    def test_user_info_age_calculation(self):
        info = UserInfo(name='John', yob=2000)
        current_year = datetime.now(timezone.utc).year
        self.assertEqual(info.age, current_year - 2000)

        # Constructor with age param sets yob correctly
        info2 = UserInfo(name='Jane', age=30)
        self.assertEqual(info2.yob, current_year - 30)
        self.assertEqual(info2.age, 30)

    def test_body_condition_log_bmi(self):
        user = User(email='bcl@shwi.com', name='BMI Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        # Weight: 80kg, Height: 180cm -> BMI = 80 / (1.8^2) = 24.69 -> 24.7
        log = BodyConditionLog(user_id=user.id, weight=80.0, height=180.0)
        db.session.add(log)
        db.session.commit()

        self.assertAlmostEqual(log.bmi, 24.7, places=1)
        self.assertEqual(log.to_dict()['bmi'], 24.7)

    def test_monthly_weight_history_forward_fill(self):
        user = User(email='weight@shwi.com', name='Weight History Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        now = datetime.now(timezone.utc)
        today = now.date()

        # Log weight today: 75.0kg
        db.session.add(BodyConditionLog(user_id=user.id, weight=75.0, height=175.0, date=today))
        db.session.commit()

        history = user.get_monthly_weight_history()
        self.assertGreater(len(history), 0)
        self.assertEqual(history[-1]['weight'], 75.0)

    def test_step_log_time_label_determination(self):
        self.assertEqual(StepLog.determine_time_label(2), '6AM')
        self.assertEqual(StepLog.determine_time_label(5), '6AM')
        self.assertEqual(StepLog.determine_time_label(7), '9AM')
        self.assertEqual(StepLog.determine_time_label(11), '12PM')
        self.assertEqual(StepLog.determine_time_label(13), '3PM')
        self.assertEqual(StepLog.determine_time_label(16), '6PM')
        self.assertEqual(StepLog.determine_time_label(20), '9PM')

    def test_get_today_steps_breakdown(self):
        user = User(email='steps@shwi.com', name='Steps Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        today = datetime.now(timezone.utc).date()
        db.session.add(StepLog(user_id=user.id, date=today, time_label='6AM', steps=1500, distance_km=1.1, time_walked_minutes=15))
        db.session.add(StepLog(user_id=user.id, date=today, time_label='9AM', steps=3000, distance_km=2.2, time_walked_minutes=30))
        db.session.commit()

        breakdown = user.get_today_steps_breakdown(today)
        self.assertEqual(breakdown['totalSteps'], 4500)
        self.assertEqual(len(breakdown['intervals']), 6)
        labels = [item['timeLabel'] for item in breakdown['intervals']]
        self.assertEqual(labels, ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'])

    def test_sleep_log_efficiency_and_cycle(self):
        user = User(email='sleep@shwi.com', name='Sleep Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        now = datetime.now(timezone.utc)
        # Duration: 400m, latency: 20m, waso: 20m -> time in bed = 440m -> efficiency = (400/440)*100 = 90.9%
        s_log = SleepLog(
            user_id=user.id,
            duration_minutes=400,
            sleep_latency_minutes=20,
            waso_minutes=20,
            deep_sleep_minutes=90,
            rem_sleep_minutes=100,
            light_sleep_minutes=210,
            time_label='Today',
            sleep_date=now
        )
        db.session.add(s_log)
        db.session.commit()

        self.assertAlmostEqual(s_log.sleep_efficiency, 90.9, places=1)

        summary = user.get_today_sleep_logs()
        self.assertEqual(summary['durationDisplay'], '6h 40m')
        self.assertAlmostEqual(summary['sleepEfficiency'], 90.9, places=1)
        self.assertEqual(summary['deepSleepMinutes'], 90)

    def test_workout_plan_and_logs(self):
        user = User(email='workout@shwi.com', name='Workout Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        plan = WorkoutPlan(user_id=user.id, name='Upper Lower Split', priority=1)
        db.session.add(plan)
        db.session.commit()

        w_log = WorkoutLog(
            user_id=user.id,
            plan_id=plan.id,
            workout_name='Upper Body Power',
            duration_minutes=60,
            note='Bench, Rows, OHP'
        )
        db.session.add(w_log)
        db.session.commit()

        self.assertEqual(plan.workout_logs.count(), 1)
        self.assertEqual(w_log.workout_plan.name, 'Upper Lower Split')

        week_logs = user.get_this_week_workout_logs()
        self.assertIsInstance(week_logs, dict)

    def test_meal_log_nutrition_aggregation(self):
        user = User(email='nutrition@shwi.com', name='Nutrition Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        now = datetime.now(timezone.utc)
        m1 = MealLog(user_id=user.id, meal_name='Breakfast', calories=500.0, protein=30.0, carbs=60.0, fat=15.0, datetime_eaten=now)
        m2 = MealLog(user_id=user.id, meal_name='Lunch', calories=700.0, protein=50.0, carbs=70.0, fat=20.0, datetime_eaten=now)
        db.session.add_all([m1, m2])
        db.session.commit()

        nutrition = user.get_today_nutrition(now.date())
        self.assertEqual(nutrition['calories'], 1200.0)
        self.assertEqual(nutrition['protein'], 80.0)
        self.assertEqual(nutrition['carbs'], 130.0)
        self.assertEqual(nutrition['fat'], 35.0)
        self.assertEqual(nutrition['mealCount'], 2)

    def test_get_full_data_structure(self):
        user = User(email='fulldata@shwi.com', name='Full Data Tester')
        user.set_password('Pass123')
        db.session.add(user)
        db.session.commit()

        full_data = user.get_full_data()
        expected_keys = {
            'profile', 'metrics', 'heartRate', 'restingHeartRate',
            'sleep', 'steps', 'workoutLogs', 'nutrition', 'weightHistory'
        }
        self.assertTrue(expected_keys.issubset(set(full_data.keys())))
        self.assertNotIn('activityDataDay', full_data)  # ActivityLog completely removed

if __name__ == '__main__':
    unittest.main()
