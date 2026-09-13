from flask import Blueprint, request, jsonify
from models import db, BodyConditionLog
from utils import token_required

body_bp = Blueprint('body', __name__)

@body_bp.route('/body-condition', methods=['GET', 'POST'])
@token_required
def handle_body_condition(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        raw_weight = data.get('weight')
        if raw_weight is None:
            return jsonify({'error': 'weight is required'}), 400

        try:
            w_val = float(raw_weight)
            if w_val <= 0:
                return jsonify({'error': 'weight must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid weight value'}), 400

        latest = current_user.latest_body_condition
        raw_height = data.get('height')
        h_val = None
        if raw_height is not None:
            try:
                h_val = float(raw_height)
            except (ValueError, TypeError):
                pass
        if h_val is None:
            h_val = latest.get('height', 175.0) if latest else 175.0

        bf_val = None
        if data.get('bodyFat') is not None:
            try:
                bf_val = float(data['bodyFat'])
            except (ValueError, TypeError):
                pass

        mm_val = None
        if data.get('muscleMass') is not None:
            try:
                mm_val = float(data['muscleMass'])
            except (ValueError, TypeError):
                pass

        log = BodyConditionLog(
            user_id=current_user.id,
            weight=w_val,
            height=h_val,
            body_fat=bf_val,
            muscle_mass=mm_val,
            date=data.get('date')
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            'message': 'Body condition logged successfully',
            'log': log.to_dict()
        }), 201

    limit = request.args.get('limit', 30, type=int)
    logs = BodyConditionLog.query.filter_by(user_id=current_user.id).order_by(
        BodyConditionLog.date.desc(),
        BodyConditionLog.created_at.desc(),
        BodyConditionLog.id.desc()
    ).limit(limit).all()

    return jsonify({
        'bodyConditionLogs': [item.to_dict() for item in logs],
        'monthlyWeightHistory': current_user.get_monthly_weight_history()
    }), 200


@body_bp.route('/body-condition/<int:log_id>', methods=['DELETE'])
@token_required
def delete_body_condition(current_user, log_id):
    log = BodyConditionLog.query.filter_by(id=log_id, user_id=current_user.id).first()
    if not log:
        return jsonify({'error': 'Body condition log not found'}), 404

    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Body condition log deleted successfully'}), 200
