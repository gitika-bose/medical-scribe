"""
AI processing, document handling, and question generation routes.

Endpoints:
- POST /appointments/<id>/process            — Combined processor (transcribe + PDF extract + SOAP)
- POST /appointments/<id>/generate-questions  — Generate patient questions from transcript
- POST /appointments/<id>/upload-notes        — Store plain text notes on appointment
- POST /appointments/<id>/upload-document     — Upload PDF document to GCS
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from utils.processing import transcribe_full_recording, generate_soap_from_text, extract_text_from_pdf_gcs
from utils.constants import Constants
from routes.services import (
    get_services,
    get_appointment_or_404,
    set_appointment_error,
    update_title_if_empty,
    parse_notes_from_request,
)

processing_bp = Blueprint('processing', __name__)


@processing_bp.route('/appointments/<appointment_id>/generate-questions', methods=['POST'])
@verify_firebase_token
def generate_questions(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/generate-questions
    Generates 2-3 potential questions based on the transcript so far.
    """
    try:
        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        # Use rawTranscript if available, fall back to notes or processedSummary
        transcript = appointment_data.get('rawTranscript', '')
        if not transcript:
            transcript = appointment_data.get('notes', '')
        if not transcript:
            # Fall back to the processed summary text as a last resort
            processed = appointment_data.get('processedSummary', {})
            if isinstance(processed, dict):
                transcript = processed.get('summary', '')

        if not transcript:
            return jsonify({'error': 'No transcript or notes available yet'}), 400

        try:
            _, _, ai_service = get_services()
            questions = ai_service.generate_questions(transcript)
        except Exception as e:
            return jsonify({'error': f'Question generation failed: {str(e)}'}), 500

        return jsonify({
            'questions': questions,
            'message': 'Questions generated successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@processing_bp.route('/appointments/<appointment_id>/upload-notes', methods=['POST'])
@verify_firebase_token
def upload_notes(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-notes
    Stores plain text notes on the appointment document in Firestore.
    Accepts 'notes' from form data or JSON body.
    """
    try:
        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        notes_text = parse_notes_from_request(request)

        if not notes_text:
            return jsonify({'error': 'No notes provided', 'status': 'failed'}), 400

        print(f"[Upload Notes] Storing {len(notes_text)} characters of notes for appointment {appointment_id}")

        appointment_ref.update({
            'notes': notes_text,
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        return jsonify({
            'message': 'Notes uploaded successfully',
            'appointmentId': appointment_id,
            'notesLength': len(notes_text),
            'status': 'uploaded'
        }), 200

    except Exception as e:
        print(f"[Upload Notes] Error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@processing_bp.route('/appointments/<appointment_id>/upload-document', methods=['POST'])
@verify_firebase_token
def upload_document(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-document
    Uploads a PDF document to Google Cloud Storage and returns the GCS URI.
    Does NOT extract text — that is handled by the /process endpoint.
    """
    try:
        if 'document' not in request.files:
            return jsonify({'error': 'No document file provided', 'status': 'failed'}), 400

        doc_file = request.files['document']

        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        doc_content = doc_file.read()
        original_filename = doc_file.filename or 'document.pdf'
        doc_size_mb = len(doc_content) / (1024 * 1024)
        print(f"[Upload Document] Received {original_filename}: {doc_size_mb:.2f} MB")

        _, store_service, _ = get_services()
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        gcs_filename = f"documents/{appointment_id}/{timestamp}_{original_filename}"
        document_gcs_uri = store_service.upload_file(
            doc_content, gcs_filename, content_type='application/pdf'
        )
        print(f"[Upload Document] Uploaded to GCS: {document_gcs_uri}")

        # Append to documentLinks array (supports multiple documents)
        existing_links = appointment_data.get('documentLinks', [])
        if not isinstance(existing_links, list):
            existing_links = [existing_links] if existing_links else []
        existing_links.append(document_gcs_uri)

        update_fields = {
            'documentLinks': existing_links,
            'documentLink': document_gcs_uri,  # backward compat: last uploaded doc
            'lastUpdated': datetime.utcnow().isoformat(),
        }
        appointment_ref.update(update_fields)

        return jsonify({
            'message': 'Document uploaded successfully',
            'appointmentId': appointment_id,
            'documentGcsUri': document_gcs_uri,
            'documentCount': len(existing_links),
            'status': 'uploaded'
        }), 200

    except Exception as e:
        print(f"[Upload Document] Error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@processing_bp.route('/appointments/<appointment_id>/process', methods=['POST'])
@verify_firebase_token
def process_appointment(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/process
    Accepts recording GCS URI, notes text, and/or document GCS URI.
    Stores all references in Firebase, processes all inputs together
    (transcribe recording, extract PDF text, combine with notes),
    generates a SOAP summary, and updates the appointment.

    Request body (JSON):
    {
        "recordingGcsUri": "gs://...",   // optional
        "notes": "plain text notes",      // optional
        "documentGcsUri": "gs://..."      // optional
    }
    At least one of the above must be provided.
    """
    try:
        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        # Parse inputs from JSON body or form data
        json_data = request.get_json(silent=True) or {}
        recording_gcs_uri = json_data.get('recordingGcsUri', '') or request.form.get('recordingGcsUri', '')
        notes_text = json_data.get('notes', '') or request.form.get('notes', '')
        document_gcs_uri = json_data.get('documentGcsUri', '') or request.form.get('documentGcsUri', '')

        # Fall back to values already stored on the appointment
        if not recording_gcs_uri:
            recording_gcs_uri = appointment_data.get('recordingLink', '')
        if not notes_text:
            notes_text = appointment_data.get('notes', '')
        if not document_gcs_uri:
            document_gcs_uri = appointment_data.get('documentLink', '')

        # Build list of all document URIs (supports multiple documents)
        document_gcs_uris = []
        # Check for documentLinks array first (new multi-doc format)
        stored_doc_links = appointment_data.get('documentLinks', [])
        if isinstance(stored_doc_links, list) and stored_doc_links:
            document_gcs_uris = list(stored_doc_links)
        elif document_gcs_uri:
            document_gcs_uris = [document_gcs_uri]

        has_any_input = recording_gcs_uri or notes_text or len(document_gcs_uris) > 0
        if not has_any_input:
            return jsonify({
                'error': 'At least one of recordingGcsUri, notes, or documentGcsUri must be provided',
                'status': 'failed'
            }), 400

        print(f"[Process] Starting processing for appointment {appointment_id}")
        print(f"[Process] Inputs - recording: {'yes' if recording_gcs_uri else 'no'}, "
              f"notes: {'yes' if notes_text else 'no'}, documents: {len(document_gcs_uris)}")

        # Store all references in Firebase
        update_fields = {
            'lastUpdated': datetime.utcnow().isoformat(),
            'status': 'InProgress',
        }
        if recording_gcs_uri:
            update_fields['recordingLink'] = recording_gcs_uri
        if notes_text:
            update_fields['notes'] = notes_text
        if document_gcs_uri:
            update_fields['documentLink'] = document_gcs_uri
        appointment_ref.update(update_fields)

        stt_service, store_service, ai_service = get_services()

        # Collect all text sources
        text_parts = []

        # 1. Transcribe recording if provided
        if recording_gcs_uri:
            try:
                print(f"[Process] Downloading recording from GCS...")
                audio_content = store_service.download_file(recording_gcs_uri)
                file_extension = recording_gcs_uri.split('.')[-1].lower() if '.' in recording_gcs_uri else 'webm'
                print(f"[Process] Transcribing recording ({len(audio_content)} bytes, format: {file_extension})...")

                transcript = transcribe_full_recording(
                    audio_content=audio_content,
                    file_extension=file_extension,
                    stt_service=stt_service,
                    storage_service=store_service,
                    appointment_id=appointment_id,
                )

                if transcript:
                    text_parts.append(f"=== Audio Transcript ===\n{transcript}")
                    appointment_ref.update({
                        'rawTranscript': transcript,
                        'lastUpdated': datetime.utcnow().isoformat(),
                    })
                    print(f"[Process] Transcription complete: {len(transcript)} characters")
                else:
                    print(f"[Process] Warning: Transcription returned empty result")
            except Exception as e:
                print(f"[Process] Error transcribing recording: {str(e)}")
                set_appointment_error(appointment_ref)
                return jsonify({'error': f'Recording transcription failed: {str(e)}', 'status': 'failed'}), 500

        # 2. Add notes if provided
        if notes_text:
            text_parts.append(f"=== Patient Notes ===\n{notes_text}")
            print(f"[Process] Notes included: {len(notes_text)} characters")

        # 3. Extract text from PDF documents (supports multiple)
        for doc_idx, doc_uri in enumerate(document_gcs_uris):
            try:
                print(f"[Process] Extracting text from document {doc_idx + 1}/{len(document_gcs_uris)}...")
                pdf_text = extract_text_from_pdf_gcs(doc_uri, store_service)
                if pdf_text:
                    label = f"=== Document Content ({doc_idx + 1}) ===" if len(document_gcs_uris) > 1 else "=== Document Content ==="
                    text_parts.append(f"{label}\n{pdf_text}")
                    print(f"[Process] Document {doc_idx + 1} text extracted: {len(pdf_text)} characters")
                else:
                    print(f"[Process] Warning: Document {doc_idx + 1} text extraction returned empty result")
            except Exception as e:
                print(f"[Process] Error extracting text from document {doc_idx + 1}: {str(e)}")
                set_appointment_error(appointment_ref)
                return jsonify({'error': f'PDF text extraction failed for document {doc_idx + 1}: {str(e)}', 'status': 'failed'}), 500

        # Combine all text
        combined_text = "\n\n".join(text_parts)
        print(f"[Process] Combined text length: {len(combined_text)} characters")

        if not combined_text.strip():
            set_appointment_error(appointment_ref)
            return jsonify({'error': 'No text content available to process', 'status': 'failed'}), 400

        # Generate SOAP summary from combined text
        try:
            print(f"[Process] Generating SOAP summary...")
            soap_notes = generate_soap_from_text(combined_text, ai_service, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_3)
            print(f"[Process] SOAP summary generated successfully")
        except Exception as e:
            print(f"[Process] Error generating SOAP summary: {str(e)}")
            set_appointment_error(appointment_ref)
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500

        # Update appointment with results
        appointment_ref.update({
            'processedSummary': soap_notes,
            'status': 'Completed',
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        # Set title if not already set
        update_title_if_empty(appointment_ref, soap_notes)
        print(f"[Process] Appointment {appointment_id} processed successfully")

        return jsonify({
            'message': 'Appointment processed successfully',
            'appointmentId': appointment_id,
            'soapNotes': soap_notes,
            'status': 'Completed',
            'inputsProcessed': {
                'recording': bool(recording_gcs_uri),
                'notes': bool(notes_text),
                'documents': len(document_gcs_uris),
            }
        }), 200

    except Exception as e:
        print(f"[Process] Unexpected error: {str(e)}")
        try:
            set_appointment_error(appointment_ref)
        except Exception:
            pass
        return jsonify({'error': str(e), 'status': 'failed'}), 500
