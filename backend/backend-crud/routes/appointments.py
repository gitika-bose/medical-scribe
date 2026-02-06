from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from config import initialize_firebase
import uuid

# Initialize Blueprint
appointments_bp = Blueprint('appointments', __name__)

# Initialize Firestore
db = initialize_firebase()


@appointments_bp.route('/appointments', methods=['GET', 'POST'])
@verify_firebase_token
def handle_appointments(user_id):
    """
    GET /appointments
    Returns all appointments for the authenticated user
    
    POST /appointments
    Creates a new appointment object in Firestore at the start of a user session
    """
    if request.method == 'GET':
        try:
            # Query Firestore for user's appointments
            appointments_ref = db.collection('appointments')
            query = appointments_ref.where('userId', '==', user_id).order_by('CreatedDate', direction='DESCENDING')
            
            appointments = []
            for doc in query.stream():
                appointment_data = doc.to_dict()
                appointments.append(appointment_data)
            
            return jsonify({
                'appointments': appointments,
                'count': len(appointments)
            }), 200
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    try:
        # Generate unique appointment ID
        appointment_id = str(uuid.uuid4())
        
        # Create appointment document
        appointment_data = {
            'appointmentId': appointment_id,
            'userId': user_id,
            'RawTranscript': '',
            'CreatedDate': datetime.utcnow().isoformat(),
            'LastUpdated': datetime.utcnow().isoformat(),
            'Status': 'In Progress',
            'RecordingLink': ''
        }
        
        # Save to Firestore
        db.collection('appointments').document(appointment_id).set(appointment_data)
        
        return jsonify({
            'appointmentId': appointment_id,
            'status': 'In Progress',
            'message': 'Appointment created successfully'
        }), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointments_bp.route('/appointments/<appointment_id>', methods=['GET', 'DELETE'])
@verify_firebase_token
def handle_appointment(user_id, appointment_id):
    """
    GET /appointments/{appointmentId}
    Fetches appointment data for the specified appointment ID
    
    DELETE /appointments/{appointmentId}
    Deletes the specified appointment
    """
    try:
        # Get appointment from Firestore
        appointment_ref = db.collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        
        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found'}), 404
        
        appointment_data = appointment_doc.to_dict()
        
        # Verify appointment belongs to user
        if appointment_data.get('userId') != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Handle based on HTTP method
        if request.method == 'GET':
            return jsonify(appointment_data), 200
        
        elif request.method == 'DELETE':
            # Note: Storage deletion is handled by the processing service
            # This service only handles Firestore CRUD operations
            
            # Delete the appointment from Firestore
            appointment_ref.delete()
            
            return jsonify({
                'message': 'Appointment deleted successfully',
                'appointmentId': appointment_id
            }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
