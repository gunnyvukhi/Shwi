import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
import pymysql
from sqlalchemy import text, inspect

from config import Config
from models import db
from routes.auth import auth_bp
from routes.user import user_bp

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
    """Dynamically add missing columns and migrate profile data to user_info."""
    with app.app_context():
        # Creates all newly defined tables: user_info, heart_rate_logs, sleep_logs, step_logs, workout_logs, food_intake_logs
        db.create_all()
        
        columns_to_add = [
            ("is_verified", "TINYINT(1) NOT NULL DEFAULT 0"),
            ("otp_code", "VARCHAR(6) NULL"),
            ("otp_expiry", "DATETIME NULL"),
            ("otp_purpose", "VARCHAR(30) NULL"),
            ("google_id", "VARCHAR(255) NULL UNIQUE"),
            ("apple_id", "VARCHAR(255) NULL UNIQUE"),
            ("reset_token", "VARCHAR(255) NULL"),
            ("reset_token_expiry", "DATETIME NULL")
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

            if engine_name != 'sqlite':
                try:
                    conn.execute(text("ALTER TABLE users MODIFY COLUMN `name` VARCHAR(100) NULL DEFAULT '';"))
                    conn.commit()
                except Exception:
                    pass

            # Migrate existing users' profile info to user_info table if missing
            try:
                inspector = inspect(db.engine)
                user_cols = [c['name'] for c in inspector.get_columns('users')]
                
                users_missing_info = conn.execute(text(
                    "SELECT u.id FROM users u LEFT JOIN user_info ui ON u.id = ui.user_id WHERE ui.id IS NULL"
                )).fetchall()

                for row in users_missing_info:
                    uid = row[0]
                    profile_cols = [
                        'name', 'avatar_url', 'wallpaper_url', 'bio', 'fitness_goal',
                        'target_weight', 'current_weight', 'height', 'gender', 'phone',
                        'age', 'experience_level', 'workout_split', 'body_fat', 'rhr'
                    ]
                    available_cols = [c for c in profile_cols if c in user_cols]

                    if available_cols:
                        cols_str = ", ".join([f"`{c}`" if engine_name != 'sqlite' else c for c in available_cols])
                        row_data = conn.execute(
                            text(f"SELECT {cols_str} FROM users WHERE id = :uid"),
                            {"uid": uid}
                        ).mappings().first()
                        
                        if row_data:
                            data_dict = dict(row_data)
                            ins_cols = ['user_id'] + list(data_dict.keys())
                            ins_placeholders = [':user_id'] + [f":{k}" for k in data_dict.keys()]
                            ins_cols_str = ", ".join([f"`{c}`" if engine_name != 'sqlite' else c for c in ins_cols])
                            ins_vals_str = ", ".join(ins_placeholders)
                            data_dict['user_id'] = uid
                            conn.execute(text(f"INSERT INTO user_info ({ins_cols_str}) VALUES ({ins_vals_str})"), data_dict)
                    else:
                        conn.execute(text("INSERT INTO user_info (user_id, name) VALUES (:uid, 'Member')"), {"uid": uid})

                conn.commit()
                if users_missing_info:
                    print(f"[DB Schema Upgrade] Migrated profile data for {len(users_missing_info)} user(s) into user_info table.")
            except Exception as e:
                print(f"[DB Schema Upgrade Notice] Profile migration note: {e}")

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
    app.register_blueprint(user_bp)

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
