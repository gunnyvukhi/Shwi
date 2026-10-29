from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, BodyConditionLog
from utils import token_required

body_bp = Blueprint('body', __name__)

@body_bp.route('/weight-history', methods=['GET'])
@token_required
def get_weight_history(current_user):
    return jsonify({
        'weightHistory': current_user.get_monthly_weight_history()
    }), 200

@body_bp.route('/body-condition', methods=['GET', 'POST'])
@token_required
def get_body_condition(current_user):
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}

        # Lấy bản ghi body condition gần nhất của user
        latest_log = current_user.latest_body_condition

        # Lấy dữ liệu từ data (hỗ trợ cả snake_case và camelCase), nếu thiếu thì lấy từ bản ghi gần nhất
        weight = data.get('weight')
        if weight is None and latest_log:
            weight = latest_log.get("weight")

        height = data.get('height')
        if height is None and latest_log:
            height = latest_log.get("height")

        body_fat = data.get('body_fat') if 'body_fat' in data else data.get('bodyFat')
        if body_fat is None and latest_log:
            body_fat = latest_log.get("bodyFat")

        muscle_mass = data.get('muscle_mass') if 'muscle_mass' in data else data.get('muscleMass')
        if muscle_mass is None and latest_log:
            muscle_mass = latest_log.get("muscleMass")

        bmi = data.get('bmi')
        if bmi is None and latest_log and not height:
            bmi = latest_log.get("bmi")

        body_fat = data.get('body_fat') if 'body_fat' in data else data.get('bodyFat')
        if body_fat is None and latest_log:
            body_fat = latest_log.get("bodyFat")

        muscle_mass = data.get('muscle_mass') if 'muscle_mass' in data else data.get('muscleMass')
        if muscle_mass is None and latest_log:
            muscle_mass = latest_log.get("muscleMass")

        date = data.get('date')
        if date is None:
            date = datetime.now(timezone.utc).date()

        new_log = BodyConditionLog(
            user_id=current_user.id,
            weight=weight if weight is not None else 0.0,
            height=height,
            body_fat=body_fat,
            muscle_mass=muscle_mass,
            bmi=bmi,
            date=date
        )

        db.session.add(new_log)
        db.session.commit()

        return jsonify({
            'bodyCondition': new_log.to_dict(),
        }), 200

    return jsonify({
        'bodyCondition': current_user.latest_body_condition,
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
