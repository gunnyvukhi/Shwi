from flask import Blueprint, jsonify
from utils import token_required

dashbroad_bp = Blueprint('dashbroad', __name__)

@dashbroad_bp.route('/dashbroad', methods=['GET'])
@dashbroad_bp.route('/dashboard', methods=['GET'])
@dashbroad_bp.route('', methods=['GET'])
@token_required
def get_user_dashboard(current_user):
    """
    Return all aggregated non-sensitive profile, health metrics, and logs for the authenticated user.
    Accessible via GET /api/user/dashbroad, GET /api/user/dashboard, and GET /api/user.
    """
    return jsonify(current_user.get_full_data()), 200
