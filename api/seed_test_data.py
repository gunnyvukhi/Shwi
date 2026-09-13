"""
seed_test_data.py
Script to create a primary test user account and seed realistic, high-quality mock data
tied directly to that account for immediate API testing.
"""

from app import create_app
from models import db
from utils import generate_jwt_token
from mock_data import create_or_get_test_user, seed_mock_logs

def main():
    app = create_app()
    with app.app_context():
        print("=" * 60)
        print("  SHWI GYM API - TEST ACCOUNT & MOCK DATA SEEDER")
        print("=" * 60)

        # 1. Create or retrieve test user
        user = create_or_get_test_user(
            email='testuser@shwigym.com',
            password='Password123@',
            name='Alex Mercer'
        )

        # 2. Seed comprehensive mock health data
        summary = seed_mock_logs(user.id, clear_existing=True)

        # 3. Generate a JWT token valid for 7 days
        token = generate_jwt_token(user.id)

        print("\n[OK] Test Account Ready:")
        print(f"  - User ID     : {user.id}")
        print(f"  - Email       : {user.email}")
        print(f"  - Password    : Password123@")
        print(f"  - Verified    : {user.is_verified}")
        print(f"  - Name        : {user.name}")
        print(f"  - Target Steps: {user.get_info().target_steps}")

        print("\n[OK] Seeded Mock Data Summary:")
        for log_type, count in summary.items():
            print(f"  - {log_type:<22}: {count} records")

        print("\n[OK] JWT Bearer Token (7-day validity for testing):")
        print(f"Bearer {token}")
        print("=" * 60)

if __name__ == '__main__':
    main()
