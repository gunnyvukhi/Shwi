from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from models import db, MealLog
from utils import token_required

meal_bp = Blueprint('meal', __name__)

def _handle_meal_request(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('mealName') or data.get('meal_name') or data.get('foodName') or data.get('food_name') or data.get('mealType') or 'Meal'
        if not name:
            return jsonify({'error': 'mealName is required'}), 400

        def parse_float_safe(val, default=0.0):
            if val is not None:
                try:
                    return float(val)
                except (ValueError, TypeError):
                    pass
            return default

        cal_val = parse_float_safe(data.get('calories'), 0.0)
        protein_val = parse_float_safe(data.get('protein'), 0.0)
        carbs_val = parse_float_safe(data.get('carbs'), 0.0)
        fat_val = parse_float_safe(data.get('fat'), 0.0)

        dt_eaten = None
        raw_dt = data.get('datetimeEaten') or data.get('datetime_eaten') or data.get('date')
        if raw_dt:
            try:
                dt_eaten = datetime.fromisoformat(str(raw_dt).replace('Z', '+00:00'))
            except Exception:
                pass

        log = MealLog(
            user_id=current_user.id,
            meal_name=str(name).strip(),
            calories=cal_val,
            protein=protein_val,
            carbs=carbs_val,
            fat=fat_val,
            datetime_eaten=dt_eaten or datetime.now(timezone.utc)
        )
        db.session.add(log)
        db.session.commit()

        target_date = log.datetime_eaten.date() if log.datetime_eaten else datetime.now(timezone.utc).date()

        return jsonify({
            'message': 'Meal logged successfully',
            'log': log.to_dict(),
            'todayNutrition': current_user.get_today_nutrition(target_date)
        }), 201

    # GET request
    raw_date = request.args.get('date')
    parsed_date = None
    if raw_date:
        try:
            parsed_date = datetime.strptime(raw_date.split('T')[0].strip(), '%Y-%m-%d').date()
        except Exception:
            pass

    nutrition_summary = current_user.get_today_nutrition(parsed_date)
    limit = request.args.get('limit', 30, type=int)
    recent_meals = MealLog.query.filter_by(user_id=current_user.id).order_by(
        MealLog.datetime_eaten.desc(),
        MealLog.id.desc()
    ).limit(limit).all()

    return jsonify({
        'nutrition': nutrition_summary,
        'meals': [m.to_dict() for m in recent_meals],
        'foodIntakeLogs': [m.to_dict() for m in recent_meals] # backward compatibility
    }), 200


def _delete_meal_request(current_user, meal_id):
    log = MealLog.query.filter_by(id=meal_id, user_id=current_user.id).first()
    if not log:
        return jsonify({'error': 'Meal log not found'}), 404

    db.session.delete(log)
    db.session.commit()
    return jsonify({'message': 'Meal log deleted successfully'}), 200


# Route endpoints
@meal_bp.route('/meals', methods=['GET', 'POST'])
@token_required
def handle_meals(current_user):
    return _handle_meal_request(current_user)

@meal_bp.route('/meals/<int:meal_id>', methods=['DELETE'])
@token_required
def delete_meal(current_user, meal_id):
    return _delete_meal_request(current_user, meal_id)

# Compatibility alias routes for /food-intake
@meal_bp.route('/food-intake', methods=['GET', 'POST'])
@token_required
def handle_food_intake(current_user):
    return _handle_meal_request(current_user)

@meal_bp.route('/food-intake/<int:meal_id>', methods=['DELETE'])
@token_required
def delete_food_intake(current_user, meal_id):
    return _delete_meal_request(current_user, meal_id)
