import unittest
from flask import Flask
from models import db, User, BodyConditionLog, WorkoutPlan, WorkoutLog, MealLog
from routes.user import user_bp
from utils import generate_jwt_token

class TestUserRoutes(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app.config['SECRET_KEY'] = 'test-secret-gym-key-32bytes-for-jwt-signing'
        db.init_app(self.app)
        self.app.register_blueprint(user_bp)

        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        # Create primary test user
        self.user = User(name='Test Runner', email='runner@shwi.com', is_verified=True)
        self.user.set_password('Password123@')
        db.session.add(self.user)
        db.session.commit()

        self.token = generate_jwt_token(self.user.id)
        self.headers = {'Authorization': f'Bearer {self.token}'}
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_profile_get_and_put(self):
        # GET profile
        res = self.client.get('/api/user/profile', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['user']['email'], 'runner@shwi.com')

        # PUT profile
        res_put = self.client.put('/api/user/profile', headers=self.headers, json={
            'name': 'Runner Updated',
            'bio': 'Lifting weights daily',
            'fitnessGoal': 1,
            'targetWeight': 75.5,
            'targetSteps': 12000,
            'gender': 0,
            'yob': 1995,
            'weight': 80.0,
            'height': 180.0
        })
        self.assertEqual(res_put.status_code, 200)
        info = self.user.get_info()
        self.assertEqual(info.name, 'Runner Updated')
        self.assertEqual(info.fitness_goal, 1)
        self.assertEqual(info.target_steps, 12000)
        self.assertEqual(info.yob, 1995)

    def test_body_condition_crud(self):
        # POST body condition
        res = self.client.post('/api/user/body-condition', headers=self.headers, json={
            'weight': 78.5,
            'height': 178.0,
            'bodyFat': 16.0,
            'muscleMass': 60.5
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['log']['weight'], 78.5)
        self.assertIsNotNone(data['log']['bmi'])

        # GET body conditions
        res_get = self.client.get('/api/user/body-condition', headers=self.headers)
        self.assertEqual(res_get.status_code, 200)
        get_data = res_get.get_json()
        self.assertGreater(len(get_data['bodyConditionLogs']), 0)

        # DELETE body condition
        log = BodyConditionLog.query.filter_by(user_id=self.user.id).first()
        assert log is not None
        res_del = self.client.delete(f'/api/user/body-condition/{log.id}', headers=self.headers)
        self.assertEqual(res_del.status_code, 200)

    def test_heart_rate_endpoints(self):
        # POST heart rate (Backend handles database update)
        res = self.client.post('/api/user/heart-rate', headers=self.headers, json={'bpm': 75})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.get_json()['log']['bpm'], 75)

        # POST resting heart rate (Backend handles database update)
        res_rhr = self.client.post('/api/user/resting-heart-rate', headers=self.headers, json={'bpm': 58})
        self.assertEqual(res_rhr.status_code, 201)
        self.assertEqual(res_rhr.get_json()['log']['bpm'], 58)

    def test_sleep_endpoints(self):
        res = self.client.post('/api/user/sleep', headers=self.headers, json={
            'durationMinutes': 450,
            'sleepLatencyMinutes': 10,
            'wasoMinutes': 15,
            'deepSleepMinutes': 90,
            'remSleepMinutes': 100,
            'lightSleepMinutes': 245
        })
        self.assertEqual(res.status_code, 201)
        log = res.get_json()['log']
        self.assertEqual(log['durationMinutes'], 450)
        self.assertGreater(log['sleepEfficiency'], 0)

        res_get = self.client.get('/api/user/sleep', headers=self.headers)
        self.assertEqual(res_get.status_code, 200)
        self.assertIn('todaySleep', res_get.get_json())

    def test_steps_endpoints(self):
        res = self.client.post('/api/user/steps', headers=self.headers, json={
            'steps': 5000,
            'timeLabel': '12PM'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data['log']['steps'], 5000)
        self.assertEqual(data['log']['timeLabel'], '12PM')

        # GET steps breakdown
        res_get = self.client.get('/api/user/steps', headers=self.headers)
        self.assertEqual(res_get.status_code, 200)
        breakdown = res_get.get_json()['breakdown']
        self.assertEqual(breakdown['totalSteps'], 5000)

    def test_workout_and_plans(self):
        # Create plan
        res_plan = self.client.post('/api/user/workout-plans', headers=self.headers, json={
            'name': 'PPL Split',
            'priority': 1,
            'note': 'Hypertrophy focus'
        })
        self.assertEqual(res_plan.status_code, 201)
        plan_id = res_plan.get_json()['plan']['id']

        # Get plans
        res_plans = self.client.get('/api/user/workout-plans', headers=self.headers)
        self.assertEqual(res_plans.status_code, 200)
        self.assertEqual(len(res_plans.get_json()['plans']), 1)

        # Post workout log
        res_w = self.client.post('/api/user/workout', headers=self.headers, json={
            'workoutName': 'Chest and Triceps',
            'durationMinutes': 55,
            'planId': plan_id,
            'note': 'Bench press 80kg 4x8'
        })
        self.assertEqual(res_w.status_code, 201)

        # Get workouts
        res_w_get = self.client.get('/api/user/workout', headers=self.headers)
        self.assertEqual(res_w_get.status_code, 200)
        self.assertIn('thisWeekWorkouts', res_w_get.get_json())

    def test_meals_and_food_intake_alias(self):
        # POST meal
        res = self.client.post('/api/user/meals', headers=self.headers, json={
            'mealName': 'Protein Shake',
            'calories': 350.0,
            'protein': 40.0,
            'carbs': 30.0,
            'fat': 5.0
        })
        self.assertEqual(res.status_code, 201)
        meal_id = res.get_json()['log']['id']

        # GET meals
        res_get = self.client.get('/api/user/meals', headers=self.headers)
        self.assertEqual(res_get.status_code, 200)
        data = res_get.get_json()
        self.assertEqual(data['nutrition']['calories'], 350.0)

        # Test compatibility alias /food-intake
        res_alias = self.client.get('/api/user/food-intake', headers=self.headers)
        self.assertEqual(res_alias.status_code, 200)

        # DELETE meal
        res_del = self.client.delete(f'/api/user/meals/{meal_id}', headers=self.headers)
        self.assertEqual(res_del.status_code, 200)

    def test_dashboard_endpoint(self):
        # GET dashboard
        res = self.client.get('/api/user/dashboard', headers=self.headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # Check that new models structure is present
        self.assertIn('profile', data)
        self.assertIn('metrics', data)
        self.assertIn('sleep', data)
        self.assertIn('steps', data)
        self.assertIn('workoutLogs', data)
        self.assertIn('nutrition', data)
        self.assertIn('weightHistory', data)

        # Verify ActivityLog is not present
        self.assertNotIn('activityDataDay', data)
        self.assertNotIn('activityDataWeek', data)

        # GET dashbroad alias
        res_broad = self.client.get('/api/user/dashbroad', headers=self.headers)
        self.assertEqual(res_broad.status_code, 200)
        self.assertIn('profile', res_broad.get_json())

if __name__ == '__main__':
    unittest.main()
