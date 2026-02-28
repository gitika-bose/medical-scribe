"""
Unauthenticated "try it" / demo endpoints.

These endpoints mirror the functionality of their authenticated counterparts
but require no Firebase auth, no Firestore reads/writes, and no GCS storage.
They are intended for the public landing page demo experience.

Endpoints:
- POST /appointments/generate-questions-try  — Generate questions from provided text
- POST /appointments/upload-recording-try    — Upload recording, transcribe, generate SOAP
- POST /appointments/upload-notes-try        — Process pasted notes into SOAP
"""

from flask import Blueprint, request, jsonify
from utils.constants import Constants
from routes.services import (
    get_services,
    detect_file_extension,
    split_audio_to_webm_chunks,
    transcribe_chunks,
    parse_notes_from_request,
)

try_bp = Blueprint('try_endpoints', __name__)


@try_bp.route('/appointments/generate-questions-try', methods=['POST'])
def generate_questions_try():
    """
    POST /appointments/generate-questions-try
    Generates 2-3 potential questions based on provided notes/transcript.
    No auth required.
    """
    try:
        # Accept transcript from form data or JSON body
        appointment_transcript = parse_notes_from_request(request)

        if not appointment_transcript:
            return jsonify({'questions': [], 'message': 'No transcript provided'}), 200

        try:
            _, _, ai_service = get_services()
            questions = ai_service.generate_questions(appointment_transcript)
        except Exception as e:
            return jsonify({'error': f'Question generation failed: {str(e)}'}), 500

        return jsonify({
            'questions': questions,
            'message': 'Questions generated successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@try_bp.route('/appointments/upload-recording-try', methods=['POST'])
def upload_recording_try():
    """
    POST /appointments/upload-recording-try
    Uploads a pre-recorded audio file, splits it into 30 s chunks,
    transcribes each chunk, and generates SOAP notes.
    Mirrors upload-recording logic but without auth, Firestore, or GCS storage.
    No auth required.
    """
    try:
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided', 'status': 'failed'}), 400

        audio_file = request.files['recording']
        print(f"[Upload Recording Try] Starting processing")

        audio_content = audio_file.read()
        file_extension = detect_file_extension(audio_file.filename)
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording Try] Received audio file: {audio_size_mb:.2f} MB, format: {file_extension}")

        # Split audio into webm chunks
        try:
            chunks = split_audio_to_webm_chunks(audio_content, file_extension)
        except Exception as e:
            print(f"[Upload Recording Try] Error loading audio: {str(e)}")
            return jsonify({'error': f'Failed to load audio file: {str(e)}', 'status': 'failed'}), 400

        # Transcribe all chunks (no GCS upload, no Firestore)
        stt_service, _, _ = get_services()

        try:
            current_transcript = transcribe_chunks(chunks, stt_service)
        except Exception as e:
            print(f"[Upload Recording Try] Transcription error: {str(e)}")
            return jsonify({'error': f'Transcription failed: {str(e)}', 'status': 'failed'}), 500

        print(f"[Upload Recording Try] All chunks processed successfully")

        if not current_transcript:
            return jsonify({'error': 'No transcript available to process', 'status': 'failed'}), 400

        # Generate SOAP notes
        print(f"[Upload Recording Try] Generating SOAP notes...")
        try:
            _, _, ai_service = get_services()
            soap_notes = ai_service.process_transcript_to_soap(current_transcript, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_2)
            print(f"[Upload Recording Try] SOAP notes generated successfully")
        except Exception as e:
            print(f"[Upload Recording Try] Error generating SOAP notes: {str(e)}")
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500

        soap_notes["version"] = Constants.SUMMARY_SCHEMA_VERSION_1_2
        new_title = soap_notes.get("title")

        return jsonify({
            'message': 'Recording uploaded and processed successfully',
            'soapNotes': soap_notes,
            'title': new_title,
            'transcript': current_transcript,
            'status': 'Completed',
            'chunksProcessed': len(chunks)
        }), 200

    except Exception as e:
        print(f"[Upload Recording Try] Unexpected error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@try_bp.route('/appointments/upload-notes-try', methods=['POST'])
def upload_notes_try():
    """
    POST /appointments/upload-notes-try
    Processes pasted appointment notes through SOAP format using LLM.
    No auth required.
    """
    try:
        if 'notes' not in request.form:
            return jsonify({'error': 'No appointment notes provided', 'status': 'failed'}), 400

        appointment_notes = request.form['notes']
        print(f"[Upload Notes Try] Starting processing")

        # Generate SOAP notes
        try:
            _, _, ai_service = get_services()
            soap_notes = ai_service.process_transcript_to_soap(appointment_notes, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_2)
            print(f"[Upload Notes Try] SOAP notes generated successfully")
        except Exception as e:
            print(f"[Upload Notes Try] Error generating SOAP notes: {str(e)}")
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500

        soap_notes["version"] = Constants.SUMMARY_SCHEMA_VERSION_1_2
        new_title = soap_notes.get("title")

        return jsonify({
            'message': 'Recording uploaded and processed successfully',
            'soapNotes': soap_notes,
            'title': new_title,
            'status': 'Completed'
        }), 200

    except Exception as e:
        print(f"[Upload Notes Try] Unexpected error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500
