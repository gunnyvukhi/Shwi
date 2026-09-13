from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, StepLog
from utils import token_required

steps_bp = Blueprint('steps', __name__)

@steps_bp.route('/steps', methods=['GET', 'POST'])
@token_required
def handle_steps(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        raw_steps = data.get('steps')
        if raw_steps is None:
            return jsonify({'error': 'steps is required'}), 400

        try:
            steps_val = int(raw_steps)
            if steps_val < 0:
                return jsonify({'error': 'steps cannot be negative'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'steps must be an integer'}), 400

        # Determine target date
        target_date = datetime.now(timezone.utc).date()
        raw_date = data.get('date')
        if raw_date:
            try:
                target_date = datetime.strptime(str(raw_date).split('T')[0].strip(), '%Y-%m-%d').date()
            except Exception:
                pass

        # Determine time_label
        time_label = data.get('timeLabel') or data.get('time_label')
        if not time_label or time_label not in StepLog.STANDARD_INTERVALS:
            now_hour = datetime.now().hour
            time_label = StepLog.determine_time_label(now_hour)

        # Calculate distance and walking minutes if omitted
        dist = data.get('distanceKm') or data.get('distance_km')
        if dist is None:
            dist = round(steps_val * 0.00075, 2)
        else:
            try:
                dist = float(dist)
            except (ValueError, TypeError):
                dist = 0.0

        walk_mins = data.get('timeWalkedMinutes') or data.get('time_walked_minutes')
        if walk_mins is None:
            walk_mins = int(steps_val / 100)
        else:
            try:
                walk_mins = int(walk_mins)
            except (ValueError, TypeError):
                walk_mins = 0

        # Upsert: check if a record for (user_id, date, time_label) already exists
        existing_log = StepLog.query.filter_by(
            user_id=current_user.id,
            date=target_date,
            time_label=time_label
        ).first()

        if existing_log:
            existing_log.steps = steps_val
            existing_log.distance_km = dist
            existing_log.time_walked_minutes = walk_mins
            log = existing_log
        else:
            log = StepLog(
                user_id=current_user.id,
                date=target_date,
                time_label=time_label,
                steps=steps_val,
                distance_km=dist,
                time_walked_minutes=walk_mins
            )
            db.session.add(log)

        db.session.commit()
        return jsonify({
            'message': 'Steps logged successfully',
            'log': log.to_dict(),
            'todayBreakdown': current_user.get_today_steps_breakdown(target_date)
        }), 201

    # GET request
    raw_target_date = request.args.get('date')
    parsed_target_date = None
    if raw_target_date:
        try:
            parsed_target_date = datetime.strptime(raw_target_date.split('T')[0].strip(), '%Y-%m-%d').date()
        except Exception:
            pass

    today_breakdown = current_user.get_today_steps_breakdown(parsed_target_date)
    recent_logs = StepLog.query.filter_by(user_id=current_user.id).order_by(
        StepLog.date.desc(),
        StepLog.id.desc()
    ).limit(30).all()

    return jsonify({
        'breakdown': today_breakdown,
        'stepLogs': [item.to_dict() for item in recent_logs]
    }), 200
