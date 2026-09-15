import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'super-secret-gym-key-2026-production-ready-secret-key-32bytes')
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()
    APPLE_CLIENT_ID = os.getenv('APPLE_CLIENT_ID', '').strip()
    
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DB = os.getenv('MYSQL_DB', 'shwi_db')
    
    # Construct PyMySQL URI safely with URL-encoded credentials
    encoded_user = quote_plus(MYSQL_USER)
    encoded_password = quote_plus(MYSQL_PASSWORD)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        f"mysql+pymysql://{encoded_user}:{encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
    )
    # Cloudinary Cloud Storage secrets
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '').strip()
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '').strip()
    CLOUDINARY_UPLOAD_PRESET = os.getenv('CLOUDINARY_UPLOAD_PRESET', '').strip()

    # Firebase Realtime Database
    FIREBASE_DATABASE_URL = os.getenv('FIREBASE_DATABASE_URL', 'https://shwi-f683d-default-rtdb.asia-southeast1.firebasedatabase.app').strip()
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json').strip()

    SQLALCHEMY_TRACK_MODIFICATIONS = False
