from app import create_app
from models import db, User, UserInfo, HeartRateLog, SleepLog, StepLog, WorkoutLog, FoodIntakeLog

app = create_app()

with app.app_context():
    client = app.test_client()
    
    # 1. Test Dashboard endpoint (seeding + payload)
    res = client.get('/api/user/dashboard')
    assert res.status_code == 200, f"Dashboard failed: {res.data}"
    data = res.get_json()
    
    assert 'heartRateLogs' in data, "heartRateLogs missing from dashboard response"
    assert 'sleepLogs' in data, "sleepLogs missing from dashboard response"
    assert 'stepLogs' in data, "stepLogs missing from dashboard response"
    assert 'workoutLogs' in data, "workoutLogs missing from dashboard response"
    assert 'foodIntakeLogs' in data, "foodIntakeLogs missing from dashboard response"
    assert 'activityDataDay' in data, "activityDataDay missing"
    assert 'weightDataMonth' in data, "weightDataMonth missing"
    
    print(f"Dashboard verified: {len(data['heartRateLogs'])} HR logs, {len(data['workoutLogs'])} workouts, {len(data['foodIntakeLogs'])} food logs.")

    # 2. Test Heart Rate GET and POST
    res_hr = client.post('/api/user/heart-rate', json={
        'bpm': 125,
        'restingBpm': 60,
        'status': 'Cardio',
        'timeLabel': '10:00 AM'
    })
    assert res_hr.status_code == 201, f"POST /heart-rate failed: {res_hr.data}"
    
    res_hr_list = client.get('/api/user/heart-rate')
    assert res_hr_list.status_code == 200
    hr_list = res_hr_list.get_json()['heartRateLogs']
    assert any(log['bpm'] == 125 for log in hr_list), "New HR log not found in GET response"
    print("Heart Rate REST endpoints (GET, POST) verified successfully!")

    # 3. Test Sleep POST
    res_sleep = client.post('/api/user/sleep', json={
        'durationMinutes': 480,
        'sleepQuality': 90.0,
        'timeLabel': 'Today'
    })
    assert res_sleep.status_code == 201
    print("Sleep REST endpoints verified successfully!")

    # 4. Test Steps POST
    res_steps = client.post('/api/user/steps', json={
        'steps': 15000,
        'targetSteps': 10000,
        'timeLabel': 'Today'
    })
    assert res_steps.status_code == 201
    print("Step REST endpoints verified successfully!")

    # 5. Test Workout POST
    res_workout = client.post('/api/user/workout', json={
        'workoutName': 'Leg Day Hypertrophy',
        'durationMinutes': 55,
        'caloriesBurned': 420,
        'muscleGroup': 'Quads, Hamstrings, Calves'
    })
    assert res_workout.status_code == 201
    print("Workout REST endpoints verified successfully!")

    # 6. Test Food Intake POST
    res_food = client.post('/api/user/food-intake', json={
        'mealType': 'Breakfast',
        'foodName': 'Avocado Toast with 3 Poached Eggs',
        'calories': 520,
        'protein': 24,
        'carbs': 38,
        'fat': 22
    })
    assert res_food.status_code == 201
    print("Food Intake REST endpoints verified successfully!")

    print("\n[ALL 5 LOG MODELS & REST APIS TESTED AND VERIFIED CLEANLY!]")
