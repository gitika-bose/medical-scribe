"""
Appointment CRUD & lifecycle routes.

Endpoints:
- GET  /health                  — Service health check
- POST /appointments            — Create a new appointment
- DELETE /appointments/<id>     — Delete appointment storage files
- GET  /appointments/search     — Search appointments by processed summary
"""

import logging

from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from routes.services import db, get_services

logger = logging.getLogger(__name__)

appointments_crud_bp = Blueprint('appointments_crud', __name__)


@appointments_crud_bp.route('/health', methods=['GET'])
def health_check():
    """
    GET /health
    Quick health check endpoint to verify service is online.
    """
    return jsonify({
        'status': 'healthy',
        'service': 'backend-processing',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@appointments_crud_bp.route('/appointments', methods=['POST'])
@verify_firebase_token
def create_appointment(user_id):
    """
    POST /appointments
    Creates an empty appointment document in Firestore.
    Returns the new appointmentId.
    """
    try:
        appointments_ref = db.collection('users').document(user_id).collection('appointments')
        new_appointment_ref = appointments_ref.document()  # auto-generated ID
        appointment_id = new_appointment_ref.id

        new_appointment_ref.set({
            'status': 'InProgress',
            'appointmentDate': datetime.utcnow().isoformat(),
            'createdDate': datetime.utcnow().isoformat(),
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        logger.info("Created empty appointment %s for user %s", appointment_id, user_id)

        return jsonify({
            'message': 'Appointment created successfully',
            'appointmentId': appointment_id,
            'status': 'InProgress'
        }), 201

    except Exception as e:
        logger.error("Create appointment error: %s", str(e), exc_info=True)
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@appointments_crud_bp.route('/appointments/<appointment_id>', methods=['DELETE'])
@verify_firebase_token
def delete_appointment(user_id, appointment_id):
    """
    DELETE /appointments/{appointmentId}
    Deletes all associated storage files (recordings, chunks, documents)
    AND the Firebase/Firestore appointment document for the appointment.
    """
    try:
        _, storage_svc, _ = get_services()

        # Delete recordings folder
        recordings_deleted = storage_svc.delete_folder(f"recordings/{appointment_id}/")
        logger.info("Deleted %d files from recordings/%s/", recordings_deleted, appointment_id)

        # Delete chunks folder
        chunks_deleted = storage_svc.delete_folder(f"chunks/{appointment_id}/")
        logger.info("Deleted %d files from chunks/%s/", chunks_deleted, appointment_id)

        # Delete documents folder
        documents_deleted = storage_svc.delete_folder(f"documents/{appointment_id}/")
        print(f"[Delete Appointment] Deleted {documents_deleted} files from documents/{appointment_id}/")

        # Delete the Firestore appointment document
        firestore_deleted = False
        try:
            appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
            appointment_ref.delete()
            firestore_deleted = True
            print(f"[Delete Appointment] Deleted Firestore document for appointment {appointment_id}")
        except Exception as firestore_err:
            print(f"[Delete Appointment] Warning: Failed to delete Firestore document: {str(firestore_err)}")

        return jsonify({
            'message': 'All appointment data deleted successfully',
            'appointmentId': appointment_id,
            'filesDeleted': {
                'recordings': recordings_deleted,
                'chunks': chunks_deleted,
                'documents': documents_deleted
            },
            'firestoreDeleted': firestore_deleted
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointments_crud_bp.route('/appointments/search', methods=['GET'])
@verify_firebase_token
def search_appointments(user_id):
    """
    GET /appointments/search?q=[searchQuery]
    Searches for appointments by query in processed summary texts.
    """
    try:
        search_query = request.args.get('q', '')

        if not search_query:
            return jsonify({'error': 'Search query parameter "q" is required'}), 400

        appointments_ref = db.collection('users').document(user_id).collection('appointments')

        results = []

        for doc in appointments_ref.stream():
            appointment_data = doc.to_dict()
            processed_summary = appointment_data.get('ProcessedSummary', {})

            # Search in all SOAP fields
            search_text = ' '.join([
                str(processed_summary.get('Subjective', '')),
                str(processed_summary.get('Objective', '')),
                str(processed_summary.get('Assessment', '')),
                str(processed_summary.get('Plan', '')),
                str(processed_summary.get('OtherNotes', ''))
            ]).lower()

            if search_query.lower() in search_text:
                results.append({
                    'appointmentId': appointment_data.get('appointmentId'),
                    'createdDate': appointment_data.get('CreatedDate'),
                    'status': appointment_data.get('Status')
                })

        return jsonify({
            'query': search_query,
            'results': results,
            'count': len(results)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
