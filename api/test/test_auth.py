import unittest
from flask import Flask
from models import db, User
from routes.auth import auth_bp
from utils import generate_jwt_token

class TestAuthRoutes(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        self.app.config['SECRET_KEY'] = 'test-secret-gym-key-32bytes-for-jwt-signing'
        db.init_app(self.app)
        self.app.register_blueprint(auth_bp)

        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()

        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()

    def test_register_success(self):
        res = self.client.post('/api/auth/register', json={
            'name': 'Bob Tester',
            'email': 'bob@shwi.com',
            'password': 'Password123@'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('requireOtp'))

        user = User.query.filter_by(email='bob@shwi.com').first()
        self.assertIsNotNone(user)
        self.assertFalse(user.is_verified)
        self.assertIsNotNone(user.otp_code)

    def test_register_validation_errors(self):
        # Missing name
        res = self.client.post('/api/auth/register', json={'email': 'bob@shwi.com', 'password': '123'})
        self.assertEqual(res.status_code, 400)

        # Invalid email
        res = self.client.post('/api/auth/register', json={'name': 'Bob', 'email': 'notanemail', 'password': 'Password123'})
        self.assertEqual(res.status_code, 400)

        # Password too short
        res = self.client.post('/api/auth/register', json={'name': 'Bob', 'email': 'bob@shwi.com', 'password': '123'})
        self.assertEqual(res.status_code, 400)

    def test_verify_email_otp(self):
        user = User(name='Charlie', email='charlie@shwi.com', is_verified=False, otp_code='123456', otp_purpose='email_verification')
        user.set_password('Password123@')
        db.session.add(user)
        db.session.commit()

        # Wrong OTP
        res = self.client.post('/api/auth/verify-email-otp', json={'email': 'charlie@shwi.com', 'otp': '999999'})
        self.assertEqual(res.status_code, 400)

        # Correct OTP
        res = self.client.post('/api/auth/verify-email-otp', json={'email': 'charlie@shwi.com', 'otp': '123456'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('token', data)

        db.session.refresh(user)
        self.assertTrue(user.is_verified)

    def test_login(self):
        user = User(name='David', email='david@shwi.com', is_verified=True)
        user.set_password('Password123@')
        db.session.add(user)
        db.session.commit()

        # Correct credentials
        res = self.client.post('/api/auth/login', json={'email': 'david@shwi.com', 'password': 'Password123@'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('token', data)

        # Wrong password
        res = self.client.post('/api/auth/login', json={'email': 'david@shwi.com', 'password': 'WrongPassword'})
        self.assertEqual(res.status_code, 401)

    def test_get_me_endpoint(self):
        user = User(name='Eve', email='eve@shwi.com', is_verified=True)
        user.set_password('Password123@')
        db.session.add(user)
        db.session.commit()

        token = generate_jwt_token(user.id)

        # Without token -> 401
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, 401)

        # With valid token -> 200
        res = self.client.get('/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['user']['email'], 'eve@shwi.com')

if __name__ == '__main__':
    unittest.main()
