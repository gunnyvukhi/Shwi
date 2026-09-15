from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
import firebase_service
from utils import token_required

heart_rate_bp = Blueprint('heart_rate', __name__)

@heart_rate_bp.route('/heart-rate', methods=['GET', 'POST'])
@token_required
def handle_heart_rate(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        bpm = data.get('bpm')
        if bpm is None:
            return jsonify({'error': 'bpm is required'}), 400

        try:
            bpm_val = int(bpm)
            if bpm_val <= 0:
                return jsonify({'error': 'bpm must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'bpm must be an integer'}), 400

        recorded_at = None
        raw_rec = data.get('recordedAt') or data.get('recorded_at')
        if raw_rec:
            try:
                recorded_at = datetime.fromisoformat(str(raw_rec).replace('Z', '+00:00'))
            except Exception:
                pass

        log_data = firebase_service.save_heart_rate(
            user_id=current_user.id,
            bpm=bpm_val,
            recorded_at=recorded_at or datetime.now(timezone.utc)
        )
        return jsonify({
            'message': 'Heart rate logged successfully',
            'log': log_data,
            'heartRate': log_data
        }), 201

    return jsonify({
        'message': 'Heart rate is streamed directly via Firebase RTDB',
        'heartRateLogs': [],
        'latestHeartRate': {}
    }), 200


@heart_rate_bp.route('/resting-heart-rate', methods=['GET', 'POST'])
@token_required
def handle_resting_heart_rate(current_user):
    if request.method == 'POST':
        data = request.get_json() or {}
        bpm = data.get('bpm') or data.get('rhr')
        if bpm is None:
            return jsonify({'error': 'bpm is required'}), 400

        try:
            bpm_val = int(bpm)
            if bpm_val <= 0:
                return jsonify({'error': 'bpm must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'bpm must be an integer'}), 400

        recorded_at = None
        raw_rec = data.get('recordedAt') or data.get('recorded_at')
        if raw_rec:
            try:
                recorded_at = datetime.fromisoformat(str(raw_rec).replace('Z', '+00:00'))
            except Exception:
                pass

        log_data = firebase_service.save_resting_heart_rate(
            user_id=current_user.id,
            bpm=bpm_val,
            recorded_at=recorded_at or datetime.now(timezone.utc)
        )
        return jsonify({
            'message': 'Resting heart rate logged successfully',
            'log': log_data,
            'restingHeartRate': log_data
        }), 201

    return jsonify({
        'message': 'Resting heart rate is streamed directly via Firebase RTDB',
        'restingHeartRateLogs': [],
        'latestRestingHeartRate': {}
    }), 200
