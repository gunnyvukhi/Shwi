import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# State cache
_firebase_initialized = False
_use_firebase_admin = False
_credentials = None
_in_memory_store: Dict[str, Dict[str, Any]] = {}


def _get_config() -> tuple[str, str]:
    """Retrieve database URL and absolute service account key path."""
    try:
        from config import Config
        db_url = getattr(Config, 'FIREBASE_DATABASE_URL', '') or os.getenv('FIREBASE_DATABASE_URL', '')
        key_path = getattr(Config, 'FIREBASE_CREDENTIALS_PATH', '') or os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json')
    except Exception:
        db_url = os.getenv('FIREBASE_DATABASE_URL', '')
        key_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'firebase-key.json')

    db_url = (db_url or 'https://shwi-f683d-default-rtdb.asia-southeast1.firebasedatabase.app').rstrip('/')

    if not os.path.isabs(key_path):
        key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), key_path)

    return db_url, key_path


def init_firebase():
    """Initialize Firebase Admin SDK or Google Auth REST client."""
    global _firebase_initialized, _use_firebase_admin, _credentials

    if _firebase_initialized:
        return

    db_url, key_path = _get_config()

    if not os.path.exists(key_path):
        logger.warning(f"[Firebase] Key file not found: '{key_path}'. Using in-memory fallback.")
        _firebase_initialized = True
        return

    # 1. Try Firebase Admin SDK
    try:
        import firebase_admin
        from firebase_admin import credentials

        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(key_path), {'databaseURL': db_url})
        _use_firebase_admin = True
        _firebase_initialized = True
        logger.info(f"[Firebase] Admin SDK initialized for {db_url}")
        return
    except ImportError:
        pass
    except Exception as e:
        logger.warning(f"[Firebase] Admin SDK init failed ({e}). Falling back to REST.")

    # 2. Try Google Auth REST client
    try:
        from google.oauth2 import service_account
        from google.auth.transport.requests import Request

        _credentials = service_account.Credentials.from_service_account_file(
            key_path,
            scopes=[
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/firebase.database'
            ]
        )
        _credentials.refresh(Request())
        _use_firebase_admin = False
        _firebase_initialized = True
        logger.info(f"[Firebase] REST client initialized for {db_url}")
    except Exception as e:
        logger.warning(f"[Firebase] REST client init failed ({e}). Using in-memory fallback.")
        _firebase_initialized = True


def _get_access_token() -> Optional[str]:
    """Get active OAuth2 token from cached service account credentials."""
    global _credentials
    if not _credentials:
        return None
    try:
        from google.auth.transport.requests import Request
        if not _credentials.valid:
            _credentials.refresh(Request())
        return _credentials.token
    except Exception as e:
        logger.error(f"[Firebase] Token refresh error: {e}")
        return None


def _rtdb_put(path: str, data: dict) -> bool:
    """Overwrite data at the specified path in Firebase RTDB."""
    init_firebase()
    db_url, _ = _get_config()

    if _use_firebase_admin:
        try:
            from firebase_admin import db as fb_db
            fb_db.reference(path).set(data)
            return True
        except Exception as e:
            logger.error(f"[Firebase Admin RTDB] PUT {path}: {e}")

    token = _get_access_token()
    if token and db_url:
        try:
            import requests
            url = f"{db_url}/{path.lstrip('/')}.json?access_token={token}"
            res = requests.put(url, json=data, timeout=5)
            if res.status_code in (200, 201):
                return True
            logger.error(f"[Firebase REST] PUT {url} failed ({res.status_code}): {res.text}")
        except Exception as e:
            logger.error(f"[Firebase REST] PUT {path}: {e}")

    _in_memory_store[path] = data
    return True


def _format_iso(dt_val: Any) -> str:
    if isinstance(dt_val, datetime):
        return dt_val.astimezone(timezone.utc).isoformat()
    if isinstance(dt_val, str) and dt_val:
        return dt_val
    return datetime.now(timezone.utc).isoformat()


def _save_metric(user_id: Any, metric: str, bpm: int, recorded_at: Any = None) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        'bpm': bpm,
        'recordedAt': _format_iso(recorded_at),
        'updatedAt': now_iso
    }
    _rtdb_put(f"users/{user_id}/{metric}", payload)
    return payload


# ==========================================
# Public Write-Only API
# ==========================================

def save_heart_rate(user_id: Any, bpm: int, recorded_at: Any = None) -> dict:
    """Update heart rate for user in Firebase RTDB."""
    return _save_metric(user_id, 'heart_rate', bpm, recorded_at)


def save_resting_heart_rate(user_id: Any, bpm: int, recorded_at: Any = None) -> dict:
    """Update resting heart rate for user in Firebase RTDB."""
    return _save_metric(user_id, 'resting_heart_rate', bpm, recorded_at)
