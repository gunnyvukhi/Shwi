"""
reset_db.py
Script to cleanly wipe all existing data and tables, then initialize a brand new database schema from models.py.
Supports both MySQL and SQLite.
"""

import os
import sys
from sqlalchemy import text, inspect
import pymysql

from config import Config
from models import db
from app import create_app

def wipe_and_recreate_database():
    app = create_app()
    with app.app_context():
        engine = db.engine
        engine_name = engine.name
        print(f"[Reset DB] Active database dialect: '{engine_name}' ({engine.url})")

        if engine_name == 'sqlite':
            db_path = os.path.join(os.path.dirname(__file__), 'gym_auth.db')
            try:
                db.session.remove()
                db.engine.dispose()
            except Exception:
                pass

            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                    print(f"[Reset DB] Removed existing SQLite database file: '{db_path}'")
                except Exception as e:
                    print(f"[Reset DB Warning] Could not remove SQLite file directly ({e}), dropping all tables instead.")
                    db.drop_all()
            else:
                db.drop_all()

            # Recreate all tables
            db.create_all()
            print("[Reset DB] Created fresh SQLite database tables.")

        elif engine_name == 'mysql':
            try:
                with engine.connect() as conn:
                    # Disable foreign key checks to cleanly drop all tables
                    conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
                    inspector = inspect(engine)
                    tables = inspector.get_table_names()
                    print(f"[Reset DB] Found existing MySQL tables: {tables}")
                    for table in tables:
                        conn.execute(text(f"DROP TABLE IF EXISTS `{table}`;"))
                        print(f"[Reset DB] Dropped table '{table}'.")
                    conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
                    conn.commit()
            except Exception as e:
                print(f"[Reset DB Warning] Error during table drop: {e}")

            # Recreate all tables
            db.create_all()
            print("[Reset DB] Created fresh MySQL database tables.")

        else:
            db.drop_all()
            db.create_all()
            print(f"[Reset DB] Created fresh database tables for dialect: {engine_name}")

        # Verify created tables
        inspector = inspect(db.engine)
        created_tables = sorted(inspector.get_table_names())
        print(f"[Reset DB Success] Database initialized with {len(created_tables)} tables:")
        for t in created_tables:
            columns = [c['name'] for c in inspector.get_columns(t)]
            print(f"  - {t} ({len(columns)} columns: {', '.join(columns[:5])}{'...' if len(columns) > 5 else ''})")

if __name__ == '__main__':
    wipe_and_recreate_database()
