from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, WorkoutPlan, WorkoutLog
from utils import token_required

workout_bp = Blueprint('workout', __name__)

# ==========================================
# Workout Log Endpoints
# ==========================================

@workout_bp.route('/workout', methods=['GET', 'POST'])
@token_required
def handle_workout(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('workoutName') or data.get('workout_name')
        if not name:
            return jsonify({'error': 'workoutName is required'}), 400

        duration = data.get('durationMinutes') or data.get('duration_minutes', 45)
        try:
            dur_val = int(duration)
            if dur_val <= 0:
                return jsonify({'error': 'durationMinutes must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'durationMinutes must be an integer'}), 400

        plan_id = data.get('planId') or data.get('plan_id')
        parsed_plan_id = None
        if plan_id:
            try:
                parsed_plan_id = int(plan_id)
            except (ValueError, TypeError):
                pass

        created_at = None
        raw_created = data.get('createdAt') or data.get('created_at')
        if raw_created:
            try:
                created_at = datetime.fromisoformat(str(raw_created).replace('Z', '+00:00'))
            except Exception:
                pass

        log = WorkoutLog(
            user_id=current_user.id,
            plan_id=parsed_plan_id,
            workout_name=str(name).strip(),
            duration_minutes=dur_val,
            note=data.get('note') or data.get('notes'),
            created_at=created_at or datetime.now(timezone.utc)
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'message': 'Workout logged successfully',
            'log': log.to_dict(),
            'thisWeekWorkouts': current_user.get_this_week_workout_logs()
        }), 201

    limit = request.args.get('limit', 30, type=int)
    logs = WorkoutLog.query.filter_by(user_id=current_user.id).order_by(
        WorkoutLog.created_at.desc(),
        WorkoutLog.id.desc()
    ).limit(limit).all()

    return jsonify({
        'workoutLogs': [item.to_dict() for item in logs],
        'thisWeekWorkouts': current_user.get_this_week_workout_logs()
    }), 200


@workout_bp.route('/workout/<int:log_id>', methods=['DELETE'])
@token_required
def delete_workout(current_user, log_id):
    log = WorkoutLog.query.filter_by(id=log_id, user_id=current_user.id).first()
    if not log:
        return jsonify({'error': 'Workout log not found'}), 404

    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Workout log deleted successfully'}), 200


# ==========================================
# Workout Plan Endpoints
# ==========================================

@workout_bp.route('/workout-plans', methods=['GET', 'POST'])
@token_required
def handle_workout_plans(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        if not name:
            return jsonify({'error': 'name is required'}), 400

        priority = data.get('priority', 1)
        try:
            prio_val = int(priority)
        except (ValueError, TypeError):
            prio_val = 1

        plan = WorkoutPlan(
            user_id=current_user.id,
            name=str(name).strip(),
            priority=prio_val,
            note=data.get('note')
        )
        db.session.add(plan)
        db.session.commit()
        return jsonify({'message': 'Workout plan created successfully', 'plan': plan.to_dict()}), 201

    plans = WorkoutPlan.query.filter_by(user_id=current_user.id).order_by(
        WorkoutPlan.priority.asc(),
        WorkoutPlan.id.asc()
    ).all()
    return jsonify({'plans': [p.to_dict() for p in plans]}), 200


@workout_bp.route('/workout-plans/<int:plan_id>', methods=['PUT', 'DELETE'])
@token_required
def handle_single_workout_plan(current_user, plan_id):
    plan = WorkoutPlan.query.filter_by(id=plan_id, user_id=current_user.id).first()
    if not plan:
        return jsonify({'error': 'Workout plan not found'}), 404

    if request.method == 'DELETE':
        db.session.delete(plan)
        db.session.commit()
        return jsonify({'message': 'Workout plan deleted successfully'}), 200

    data = request.get_json() or {}
    if 'name' in data and data['name']:
        plan.name = str(data['name']).strip()
    if 'priority' in data:
        try:
            plan.priority = int(data['priority'])
        except (ValueError, TypeError):
            pass
    if 'note' in data:
        plan.note = data['note']

    db.session.commit()
    return jsonify({'message': 'Workout plan updated successfully', 'plan': plan.to_dict()}), 200
