"""
Audio upload, chunking, and transcription routes.

Endpoints:
- POST /appointments/<id>/audio-chunks          — Upload & transcribe a single audio chunk
- POST /appointments/<id>/upload-recording       — Legacy: upload full recording, chunk, transcribe, SOAP
- POST /appointments/<id>/upload-recording-new   — Upload recording to GCS only (no processing)
- POST /appointments/<id>/finalize               — Upload audio (if needed) + generate SOAP from transcript
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from utils.constants import Constants
from routes.services import (
    get_services,
    get_appointment_or_404,
    set_appointment_error,
    detect_file_extension,
    split_audio_to_webm_chunks,
    generate_soap_and_finalize,
)
import uuid

audio_bp = Blueprint('audio', __name__)


@audio_bp.route('/appointments/<appointment_id>/audio-chunks', methods=['POST'])
@verify_firebase_token
def upload_audio_chunk(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/audio-chunks
    Processes a single audio chunk, transcribes it, and appends to rawTranscript.
    """
    try:
        if 'audioChunk' not in request.files:
            return jsonify({'error': 'No audio chunk provided', 'status': 'failed'}), 400

        audio_file = request.files['audioChunk']
        audio_content = audio_file.read()
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Audio Chunk] Received: {audio_size_mb:.2f} MB")

        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        # Upload chunk to GCS and transcribe
        try:
            stt_service, storage_svc, _ = get_services()

            chunk_filename = f"chunks/{appointment_id}/{uuid.uuid4()}.webm"
            gcs_uri = storage_svc.upload_audio_file(audio_content, chunk_filename, content_type='audio/webm')
            print(f"[Audio Chunk] Uploaded to GCS: {gcs_uri}")

            print(f"[Audio Chunk] Starting transcription with inline audio ({len(audio_content)} bytes)...")
            new_transcript_text = stt_service.transcribe_audio_chunk(audio_content, use_gcs=False, gcs_uri=None)
            print(f"[Audio Chunk] Transcription completed")
        except Exception as e:
            set_appointment_error(appointment_ref)
            print(f"[Audio Chunk] Transcription error: {str(e)}")
            return jsonify({'error': f'Transcription failed: {str(e)}', 'status': 'failed'}), 500

        print(f"[Audio Chunk] New transcript text length: {len(new_transcript_text)}")

        # Re-fetch to avoid stale reads
        appointment_doc = appointment_ref.get()
        appointment_data = appointment_doc.to_dict()
        current_transcript = appointment_data.get('rawTranscript', '')
        print(f"[Audio Chunk] Current transcript length: {len(current_transcript)}")

        updated_transcript = (current_transcript + '\n' + new_transcript_text) if current_transcript else new_transcript_text
        print(f"[Audio Chunk] Updated transcript length: {len(updated_transcript)}")

        appointment_ref.update({
            'rawTranscript': updated_transcript,
            'lastUpdated': datetime.utcnow().isoformat()
        })

        print(f"[Audio Chunk] Firestore updated successfully")

        return jsonify({
            'status': 'uploaded',
            'message': 'Audio chunk processed and transcript updated',
            'transcriptLength': len(updated_transcript)
        }), 200

    except Exception as e:
        set_appointment_error(appointment_ref)
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@audio_bp.route('/appointments/<appointment_id>/upload-recording', methods=['POST'])
@verify_firebase_token
def upload_recording(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-recording
    Legacy endpoint: uploads a pre-recorded audio file, splits it into 30 s chunks,
    processes each chunk (GCS upload + transcription), and finalizes with SOAP generation.
    """
    try:
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided', 'status': 'failed'}), 400

        audio_file = request.files['recording']

        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        print(f"[Upload Recording] Starting processing for appointment {appointment_id}")

        audio_content = audio_file.read()
        file_extension = detect_file_extension(audio_file.filename)
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording] Received audio file: {audio_size_mb:.2f} MB, format: {file_extension}")

        # Split audio into webm chunks
        try:
            chunks = split_audio_to_webm_chunks(audio_content, file_extension)
        except Exception as e:
            set_appointment_error(appointment_ref)
            print(f"[Upload Recording] Error loading audio: {str(e)}")
            return jsonify({'error': f'Failed to load audio file: {str(e)}', 'status': 'failed'}), 400

        # Process each chunk: upload to GCS, transcribe, update Firestore
        stt_service, storage_svc, _ = get_services()

        for idx, chunk_content in enumerate(chunks):
            print(f"[Upload Recording] Processing chunk {idx + 1}/{len(chunks)}")

            try:
                chunk_filename = f"chunks/{appointment_id}/chunk_{idx:04d}.webm"
                gcs_uri = storage_svc.upload_audio_file(chunk_content, chunk_filename, content_type='audio/webm')
                print(f"[Upload Recording] Chunk {idx + 1} uploaded to GCS: {gcs_uri}")

                print(f"[Upload Recording] Transcribing chunk {idx + 1}...")
                new_transcript_text = stt_service.transcribe_audio_chunk(chunk_content, use_gcs=False, gcs_uri=None)
                print(f"[Upload Recording] Chunk {idx + 1} transcription completed")

                # Re-fetch to avoid stale reads
                appointment_doc = appointment_ref.get()
                current_transcript = appointment_doc.to_dict().get('rawTranscript', '')
                updated_transcript = (current_transcript + '\n' + new_transcript_text) if current_transcript else new_transcript_text

                appointment_ref.update({
                    'rawTranscript': updated_transcript,
                    'lastUpdated': datetime.utcnow().isoformat()
                })

                print(f"[Upload Recording] Chunk {idx + 1} processed successfully")

            except Exception as e:
                set_appointment_error(appointment_ref)
                print(f"[Upload Recording] Error processing chunk {idx + 1}: {str(e)}")
                return jsonify({
                    'error': f'Failed to process chunk {idx + 1}: {str(e)}',
                    'status': 'failed',
                    'chunksProcessed': idx
                }), 500

        print(f"[Upload Recording] All chunks processed successfully")

        # Upload full audio to GCS
        try:
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            full_audio_filename = f"recordings/{appointment_id}/{timestamp}_full.{file_extension}"
            recording_url = storage_svc.upload_audio_file(audio_content, full_audio_filename, content_type=f'audio/{file_extension}')
            print(f"[Upload Recording] Full audio uploaded: {recording_url}")
            appointment_ref.update({
                'recordingLink': recording_url,
                'lastUpdated': datetime.utcnow().isoformat(),
            })
        except Exception as e:
            set_appointment_error(appointment_ref)
            print(f"[Upload Recording] Error uploading full audio: {str(e)}")
            return jsonify({'error': f'Failed to upload full audio: {str(e)}', 'status': 'failed'}), 500

        # Get fresh transcript and generate SOAP
        appointment_doc = appointment_ref.get()
        raw_transcript = appointment_doc.to_dict().get('rawTranscript', '')

        _, _, ai_service = get_services()
        soap_notes, soap_error = generate_soap_and_finalize(appointment_ref, raw_transcript, ai_service, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_2)
        if soap_error:
            return soap_error

        print(f"[Upload Recording] Appointment finalized successfully")

        return jsonify({
            'message': 'Recording uploaded and processed successfully',
            'appointmentId': appointment_id,
            'recordingLink': recording_url,
            'soapNotes': soap_notes,
            'status': 'Completed',
            'chunksProcessed': len(chunks)
        }), 200

    except Exception as e:
        set_appointment_error(appointment_ref)
        print(f"[Upload Recording] Unexpected error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@audio_bp.route('/appointments/<appointment_id>/upload-recording-new', methods=['POST'])
@verify_firebase_token
def upload_recording_new(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-recording-new
    Uploads a recording file to Google Cloud Storage and returns the GCS URI.
    Does NOT transcribe or process — that is handled by the /process endpoint.
    """
    try:
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided', 'status': 'failed'}), 400

        audio_file = request.files['recording']

        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        audio_content = audio_file.read()
        file_extension = detect_file_extension(audio_file.filename)
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording New] Received {audio_size_mb:.2f} MB, format: {file_extension}")

        _, store_service, _ = get_services()
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        full_audio_filename = f"recordings/{appointment_id}/{timestamp}_full.{file_extension}"
        recording_gcs_uri = store_service.upload_file(
            audio_content, full_audio_filename, content_type=f'audio/{file_extension}'
        )
        print(f"[Upload Recording New] Uploaded to GCS: {recording_gcs_uri}")

        appointment_ref.update({
            'recordingLink': recording_gcs_uri,
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        return jsonify({
            'message': 'Recording uploaded successfully',
            'appointmentId': appointment_id,
            'recordingGcsUri': recording_gcs_uri,
            'status': 'uploaded'
        }), 200

    except Exception as e:
        print(f"[Upload Recording New] Error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@audio_bp.route('/appointments/<appointment_id>/finalize', methods=['POST'])
@verify_firebase_token
def finalize_appointment(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/finalize
    Part 1: Uploads full audio to Cloud Storage (skipped if recordingLink already exists).
    Part 2: Processes transcript into SOAP format using LLM.
    """
    try:
        appointment_ref, appointment_data, error = get_appointment_or_404(user_id, appointment_id)
        if error:
            return error

        _, store_service, ai_service = get_services()

        existing_recording_url = appointment_data.get('recordingLink', '')

        # PART 1: Upload full audio (only if not already uploaded)
        if existing_recording_url:
            recording_url = existing_recording_url
            print(f"Recording already exists for appointment {appointment_id}, skipping upload")
        else:
            if 'fullAudio' not in request.files:
                return jsonify({'error': 'No audio file provided'}), 400

            audio_file = request.files['fullAudio']
            audio_content = audio_file.read()

            try:
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                full_audio_filename = f"recordings/{appointment_id}/{timestamp}_full.webm"
                recording_url = store_service.upload_audio_file(audio_content, full_audio_filename, content_type='audio/webm')
                appointment_ref.update({
                    'recordingLink': recording_url,
                    'lastUpdated': datetime.utcnow().isoformat(),
                })
            except Exception as e:
                set_appointment_error(appointment_ref)
                return jsonify({'error': f'Audio upload failed: {str(e)}'}), 500

        # PART 2: Generate SOAP from transcript
        raw_transcript = appointment_data.get('rawTranscript', '')

        soap_notes, soap_error = generate_soap_and_finalize(appointment_ref, raw_transcript, ai_service, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_2)
        if soap_error:
            return soap_error

        return jsonify({
            'message': 'Appointment finalized successfully',
            'appointmentId': appointment_id,
            'recordingLink': recording_url,
            'soapNotes': soap_notes,
            'status': 'Completed'
        }), 200

    except Exception as e:
        set_appointment_error(appointment_ref)
        return jsonify({'error': str(e)}), 500
