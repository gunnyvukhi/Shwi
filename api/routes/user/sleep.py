from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, SleepLog
from utils import token_required

sleep_bp = Blueprint('sleep', __name__)

@sleep_bp.route('/sleep', methods=['GET', 'POST'])
@token_required
def handle_sleep(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        duration = data.get('durationMinutes') or data.get('duration_minutes')
        if not duration:
            return jsonify({'error': 'durationMinutes is required'}), 400

        try:
            dur_val = int(duration)
            if dur_val <= 0:
                return jsonify({'error': 'durationMinutes must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'durationMinutes must be an integer'}), 400

        def parse_int_or_none(val):
            if val is not None:
                try:
                    return int(val)
                except (ValueError, TypeError):
                    pass
            return None

        sleep_date = None
        raw_date = data.get('sleepDate') or data.get('sleep_date') or data.get('date')
        if raw_date:
            try:
                sleep_date = datetime.fromisoformat(str(raw_date).replace('Z', '+00:00'))
            except Exception:
                pass

        time_label = data.get('timeLabel') or data.get('time_label') or datetime.now().strftime('%a')

        log = SleepLog(
            user_id=current_user.id,
            duration_minutes=dur_val,
            sleep_latency_minutes=parse_int_or_none(data.get('sleepLatencyMinutes') or data.get('sleep_latency_minutes')),
            waso_minutes=parse_int_or_none(data.get('wasoMinutes') or data.get('waso_minutes')),
            deep_sleep_minutes=parse_int_or_none(data.get('deepSleepMinutes') or data.get('deep_sleep_minutes')),
            rem_sleep_minutes=parse_int_or_none(data.get('remSleepMinutes') or data.get('rem_sleep_minutes')),
            light_sleep_minutes=parse_int_or_none(data.get('lightSleepMinutes') or data.get('light_sleep_minutes')),
            time_label=time_label,
            sleep_date=sleep_date or datetime.now(timezone.utc)
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({'message': 'Sleep logged successfully', 'log': log.to_dict()}), 201

    limit = request.args.get('limit', 30, type=int)
    logs = SleepLog.query.filter_by(user_id=current_user.id).order_by(
        SleepLog.sleep_date.desc(),
        SleepLog.id.desc()
    ).limit(limit).all()

    return jsonify({
        'sleepLogs': [item.to_dict() for item in logs],
        'todaySleep': current_user.get_today_sleep_logs()
    }), 200
