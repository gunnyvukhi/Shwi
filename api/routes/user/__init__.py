from flask import Blueprint

from .profile import profile_bp
from .body import body_bp
from .heart_rate import heart_rate_bp
from .sleep import sleep_bp
from .steps import steps_bp
from .workout import workout_bp
from .meal import meal_bp
from .core import core_bp

user_bp = Blueprint('user', __name__, url_prefix='/api/user')

# Register all modular sub-blueprints onto user_bp
user_bp.register_blueprint(profile_bp)
user_bp.register_blueprint(body_bp)
user_bp.register_blueprint(heart_rate_bp)
user_bp.register_blueprint(sleep_bp)
user_bp.register_blueprint(steps_bp)
user_bp.register_blueprint(workout_bp)
user_bp.register_blueprint(meal_bp)
user_bp.register_blueprint(core_bp)
