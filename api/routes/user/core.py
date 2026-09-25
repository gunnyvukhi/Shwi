from flask import Blueprint, jsonify
from utils import token_required

core_bp = Blueprint('core', __name__)

@core_bp.route('/me', methods=['GET'])
@core_bp.route('/me', methods=['GET'])
@core_bp.route('', methods=['GET'])
@token_required
def get_me_data(current_user):
    """
    Return all aggregated non-sensitive profile, health metrics, and logs for the authenticated user.
    Accessible via GET /api/user/me, GET /api/user/me, and GET /api/user.
    """
    return jsonify(current_user.get_full_data()), 200
