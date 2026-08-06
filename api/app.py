import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql
from sqlalchemy import text

from config import Config
from models import db
from routes.auth import auth_bp

def ensure_mysql_db_exists(config_obj):
    """Ensure the target MySQL database exists before Flask SQLAlchemy connects to it."""
    try:
        connection = pymysql.connect(
            host=config_obj.MYSQL_HOST,
            port=config_obj.MYSQL_PORT,
            user=config_obj.MYSQL_USER,
            password=config_obj.MYSQL_PASSWORD
        )
        safe_db_name = config_obj.MYSQL_DB.replace('`', '``')
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{safe_db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        connection.close()
        print(f"[MySQL] Verified database '{config_obj.MYSQL_DB}' exists on MySQL server.")
        return True
    except Exception as e:
        print(f"[MySQL Notice] Could not connect to MySQL server ({e}).")
        print(f"[MySQL Notice] Please set MYSQL_PASSWORD in 'd:\\Shwi\\api\\.env' if your MySQL root account requires a password.")
        return False

def upgrade_schema_if_needed(app):
    """Dynamically add missing columns to the existing users table."""
    with app.app_context():
        db.create_all()
        
        columns_to_add = [
            ("is_verified", "TINYINT(1) NOT NULL DEFAULT 0"),
            ("otp_code", "VARCHAR(6) NULL"),
            ("otp_expiry", "DATETIME NULL"),
            ("otp_purpose", "VARCHAR(30) NULL"),
            ("google_id", "VARCHAR(255) NULL UNIQUE"),
            ("apple_id", "VARCHAR(255) NULL UNIQUE"),
            ("avatar_url", "VARCHAR(500) NULL")
        ]

        engine_name = db.engine.name
        with db.engine.connect() as conn:
            for col_name, col_type in columns_to_add:
                try:
                    if engine_name == 'sqlite':
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type.split(' UNIQUE')[0]};"))
                    else:
                        conn.execute(text(f"ALTER TABLE users ADD COLUMN `{col_name}` {col_type};"))
                    conn.commit()
                    print(f"[DB Schema Upgrade] Added column '{col_name}' to users table.")
                except Exception:
                    # Column already exists
                    pass

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Check target MySQL database status
    mysql_ready = ensure_mysql_db_exists(Config)

    if not mysql_ready:
        print("[DB Fallback] Falling back to SQLite database ('gym_auth.db') so the application functions seamlessly.")
        db_path = os.path.join(os.path.dirname(__file__), 'gym_auth.db')
        app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"

    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_bp)

    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({
            'status': 'healthy',
            'service': 'Shwi Gym Auth API',
            'database': 'mysql' if mysql_ready else 'sqlite'
        }), 200

    upgrade_schema_if_needed(app)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
