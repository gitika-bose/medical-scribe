from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from utils.speech_to_text import SpeechToTextService
from utils.storage import StorageService
from utils.vertex_ai import VertexAIService
from utils.processing import transcribe_full_recording, generate_soap_from_text, extract_text_from_pdf_gcs
from config import initialize_firebase, GCP_PROJECT_ID, GCP_BUCKET_NAME, GCP_LOCATION, VERTEX_AI_MODEL
import uuid
import json
import io
from pydub import AudioSegment
from functools import wraps

# Initialize Blueprint
appointments_bp = Blueprint('appointments', __name__)

# Initialize Firestore
db = initialize_firebase()

# Initialize services (lazy initialization to avoid errors if env vars not set)
speech_service = None
storage_service = None
vertex_ai_service = None

def get_services():
    """Lazy initialization of services"""
    global speech_service, storage_service, vertex_ai_service
    
    if speech_service is None:
        speech_service = SpeechToTextService()
    if storage_service is None:
        storage_service = StorageService(GCP_BUCKET_NAME, GCP_PROJECT_ID)
    if vertex_ai_service is None:
        vertex_ai_service = VertexAIService(GCP_PROJECT_ID, GCP_LOCATION, VERTEX_AI_MODEL)
    
    return speech_service, storage_service, vertex_ai_service


@appointments_bp.route('/health', methods=['GET'])
def health_check():
    """
    GET /health
    Quick health check endpoint to verify service is online
    """
    return jsonify({
        'status': 'healthy',
        'service': 'backend-processing',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@appointments_bp.route('/appointments/<appointment_id>/audio-chunks', methods=['POST'])
@verify_firebase_token
def upload_audio_chunk(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/audio-chunks
    Processes audio chunk, transcribes it, and appends to RawTranscript
    """
    try:
        # Check if file is in request
        if 'audioChunk' not in request.files:
            return jsonify({'error': 'No audio chunk provided', 'status': 'failed'}), 400
        
        audio_file = request.files['audioChunk']
        
        # Read audio content
        audio_content = audio_file.read()
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Audio Chunk] Received: {audio_size_mb:.2f} MB")
        
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        
        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404
        
        # Get services and transcribe audio chunk
        try:
            stt_service, storage_service, _ = get_services()
            
            # Upload chunk to GCS for backup/storage
            import uuid as uuid_lib
            chunk_filename = f"chunks/{appointment_id}/{uuid_lib.uuid4()}.webm"
            gcs_uri = storage_service.upload_audio_file(audio_content, chunk_filename, content_type='audio/webm')
            print(f"[Audio Chunk] Uploaded to GCS: {gcs_uri}")
            
            # Transcribe using inline audio (NOT GCS URI)
            print(f"[Audio Chunk] Starting transcription with inline audio...")
            print(f"[Audio Chunk] Audio size: {len(audio_content)} bytes")
            new_transcript_text = stt_service.transcribe_audio_chunk(audio_content, use_gcs=False, gcs_uri=None)
            print(f"[Audio Chunk] Transcription completed")
        except Exception as e:
            appointment_ref.update({
                'status': "Error",
                'lastUpdated': datetime.utcnow().isoformat()
            })
            print(f"[Audio Chunk] Transcription error: {str(e)}")
            return jsonify({'error': f'Transcription failed: {str(e)}', 'status': 'failed'}), 500
        
        print(f"[Audio Chunk] New transcript text length: {len(new_transcript_text)}")
        
        # Get FRESH appointment data to avoid stale reads
        appointment_doc = appointment_ref.get()
        appointment_data = appointment_doc.to_dict()
        
        # Append to existing transcript
        current_transcript = appointment_data.get('rawTranscript', '')
        print(f"[Audio Chunk] Current transcript length: {len(current_transcript)}")
        
        if current_transcript:
            updated_transcript = current_transcript + '\n' + new_transcript_text
        else:
            updated_transcript = new_transcript_text
        
        print(f"[Audio Chunk] Updated transcript length: {len(updated_transcript)}")
        
        # Update Firestore
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
        appointment_ref.update({
            'status': "Error",
            'lastUpdated': datetime.utcnow().isoformat()
        })
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@appointments_bp.route('/appointments/<appointment_id>/generate-questions', methods=['POST'])
@verify_firebase_token
def generate_questions(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/generate-questions
    Generates 2-3 potential questions based on transcript so far
    """
    try:
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        
        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found'}), 404
        
        appointment_data = appointment_doc.to_dict()
        
        # Get current transcript
        transcript = appointment_data.get('rawTranscript', '')
        
        if not transcript:
            return jsonify({'error': 'No transcript available yet'}), 400
        
        # Generate questions using Vertex AI
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
    

@appointments_bp.route('/appointments/generate-questions-try', methods=['POST'])
def generate_questions_try():
    """
    POST /appointments/generate-questions-try
    Generates 2-3 potential questions based on provided notes/transcript.
    No auth required.
    """
    try:
        # Accept transcript from form data or JSON body
        appointment_transcript = request.form.get('transcript', '') or request.form.get('notes', '')

        if not appointment_transcript:
            json_data = request.get_json(silent=True)
            if json_data:
                appointment_transcript = json_data.get('transcript', '') or json_data.get('notes', '')

        if not appointment_transcript:
            return jsonify({'questions': [], 'message': 'No transcript provided'}), 200

        # Generate questions using Vertex AI
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



@appointments_bp.route('/appointments/<appointment_id>/upload-recording', methods=['POST'])
@verify_firebase_token
def upload_recording(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-recording
    Uploads a pre-recorded audio file, splits it into 30s chunks, 
    processes each chunk through the audio-chunks logic, and finalizes the appointment
    """
    try:
        # Check if file is in request
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided', 'status': 'failed'}), 400
        
        audio_file = request.files['recording']
        
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        
        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404
        
        print(f"[Upload Recording] Starting processing for appointment {appointment_id}")
        
        # Read the full audio file
        audio_content = audio_file.read()
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording] Received audio file: {audio_size_mb:.2f} MB")
        
        # Load audio using pydub
        try:
            # Try to detect format from file extension or content
            file_extension = audio_file.filename.split('.')[-1].lower() if audio_file.filename else 'webm'
            print(f"[Upload Recording] Detected format: {file_extension}")
            
            # Load audio file
            audio = AudioSegment.from_file(io.BytesIO(audio_content), format=file_extension)
            print(f"[Upload Recording] Audio loaded: duration={len(audio)}ms, channels={audio.channels}, frame_rate={audio.frame_rate}")
        except Exception as e:
            appointment_ref.update({
                'status': "Error",
                'lastUpdated': datetime.utcnow().isoformat()
            })
            print(f"[Upload Recording] Error loading audio: {str(e)}")
            return jsonify({'error': f'Failed to load audio file: {str(e)}', 'status': 'failed'}), 400
        
        # Split audio into 30-second chunks
        chunk_length_ms = 30 * 1000  # 30 seconds in milliseconds
        chunks = []
        
        for i in range(0, len(audio), chunk_length_ms):
            chunk = audio[i:i + chunk_length_ms]
            chunks.append(chunk)
        
        print(f"[Upload Recording] Split audio into {len(chunks)} chunks of ~30s each")
        
        # Process each chunk through the audio-chunks logic
        stt_service, storage_service, _ = get_services()
        
        for idx, chunk in enumerate(chunks):
            print(f"[Upload Recording] Processing chunk {idx + 1}/{len(chunks)}")
            
            try:
                # Export chunk to webm format
                chunk_buffer = io.BytesIO()
                chunk.export(chunk_buffer, format='webm')
                chunk_content = chunk_buffer.getvalue()
                
                # Upload chunk to GCS for backup/storage
                import uuid as uuid_lib
                chunk_filename = f"chunks/{appointment_id}/chunk_{idx:04d}.webm"
                gcs_uri = storage_service.upload_audio_file(chunk_content, chunk_filename, content_type='audio/webm')
                print(f"[Upload Recording] Chunk {idx + 1} uploaded to GCS: {gcs_uri}")
                
                # Transcribe using inline audio
                print(f"[Upload Recording] Transcribing chunk {idx + 1}...")
                new_transcript_text = stt_service.transcribe_audio_chunk(chunk_content, use_gcs=False, gcs_uri=None)
                print(f"[Upload Recording] Chunk {idx + 1} transcription completed")
                
                # Get FRESH appointment data to avoid stale reads
                appointment_doc = appointment_ref.get()
                appointment_data = appointment_doc.to_dict()
                
                # Append to existing transcript
                current_transcript = appointment_data.get('rawTranscript', '')
                
                if current_transcript:
                    updated_transcript = current_transcript + '\n' + new_transcript_text
                else:
                    updated_transcript = new_transcript_text
                
                # Update Firestore
                appointment_ref.update({
                    'rawTranscript': updated_transcript,
                    'lastUpdated': datetime.utcnow().isoformat()
                })
                
                print(f"[Upload Recording] Chunk {idx + 1} processed successfully")
                
            except Exception as e:
                appointment_ref.update({
                    'status': "Error",
                    'lastUpdated': datetime.utcnow().isoformat()
                })
                print(f"[Upload Recording] Error processing chunk {idx + 1}: {str(e)}")
                return jsonify({
                    'error': f'Failed to process chunk {idx + 1}: {str(e)}',
                    'status': 'failed',
                    'chunksProcessed': idx
                }), 500
        
        print(f"[Upload Recording] All chunks processed successfully")
        
        # Now finalize the appointment
        print(f"[Upload Recording] Finalizing appointment...")
        
        # Upload full audio to Cloud Storage
        try:
            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
            full_audio_filename = f"recordings/{appointment_id}/{timestamp}_full.{file_extension}"
            recording_url = storage_service.upload_audio_file(audio_content, full_audio_filename, content_type=f'audio/{file_extension}')
            print(f"[Upload Recording] Full audio uploaded: {recording_url}")
            appointment_ref.update({
                'recordingLink': recording_url,
                'lastUpdated': datetime.utcnow().isoformat(),
            })
        except Exception as e:
            appointment_ref.update({
                'status': "Error",
                'lastUpdated': datetime.utcnow().isoformat()
            })
            print(f"[Upload Recording] Error uploading full audio: {str(e)}")
            return jsonify({'error': f'Failed to upload full audio: {str(e)}', 'status': 'failed'}), 500
        
        # Get fresh transcript after all chunks processed
        appointment_doc = appointment_ref.get()
        appointment_data = appointment_doc.to_dict()
        raw_transcript = appointment_data.get('rawTranscript', '')
        
        if not raw_transcript:
            appointment_ref.update({
                'status': 'Error',
                'lastUpdated': datetime.utcnow().isoformat(),
            })
            return jsonify({'error': 'No transcript available to process', 'status': 'failed'}), 400
        
        # Process transcript to SOAP format
        try:
            _, _, ai_service = get_services()
            soap_notes = ai_service.process_transcript_to_soap(raw_transcript)
            print(f"[Upload Recording] SOAP notes generated successfully")
        except Exception as e:
            print(f"[Upload Recording] Error generating SOAP notes: {str(e)}")
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500
        
        soap_notes["version"] = "1"
        # Update appointment in Firestore
        appointment_ref.update({
            'processedSummary': soap_notes,
            'status': 'Completed',
            'lastUpdated': datetime.utcnow().isoformat(),
        })


        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        appointment_data = appointment_doc.to_dict()

        curr_title = appointment_data.get("title")
        new_title = soap_notes.get("title")
        if new_title and not curr_title:
            appointment_ref.update({
                'title': new_title
            })
        print(f"Current title: {str(curr_title)}, new title: {str(new_title)}")
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
        appointment_ref.update({
            'status': 'Error',
            'lastUpdated': datetime.utcnow().isoformat(),
        })
        print(f"[Upload Recording] Unexpected error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@appointments_bp.route('/appointments/upload-recording-try', methods=['POST'])
def upload_recording_try():
    """
    POST /appointments/upload-recording-try
    Uploads a pre-recorded audio file, splits it into 30s chunks,
    transcribes each chunk, and generates SOAP notes.
    Mirrors upload-recording logic but without auth, Firestore, or GCS.
    No auth required.
    """
    try:
        # Check if file is in request
        if 'recording' not in request.files:
            return jsonify({'error': 'No recording file provided', 'status': 'failed'}), 400
        
        audio_file = request.files['recording']
        print(f"[Upload Recording Try] Starting processing")
        
        # Read the full audio file
        audio_content = audio_file.read()
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording Try] Received audio file: {audio_size_mb:.2f} MB")
        
        # Load audio using pydub
        try:
            file_extension = audio_file.filename.split('.')[-1].lower() if audio_file.filename else 'webm'
            print(f"[Upload Recording Try] Detected format: {file_extension}")
            
            audio = AudioSegment.from_file(io.BytesIO(audio_content), format=file_extension)
            print(f"[Upload Recording Try] Audio loaded: duration={len(audio)}ms, channels={audio.channels}, frame_rate={audio.frame_rate}")
        except Exception as e:
            print(f"[Upload Recording Try] Error loading audio: {str(e)}")
            return jsonify({'error': f'Failed to load audio file: {str(e)}', 'status': 'failed'}), 400
        
        # Split audio into 30-second chunks
        chunk_length_ms = 30 * 1000  # 30 seconds in milliseconds
        chunks = []
        
        for i in range(0, len(audio), chunk_length_ms):
            chunk = audio[i:i + chunk_length_ms]
            chunks.append(chunk)
        
        print(f"[Upload Recording Try] Split audio into {len(chunks)} chunks of ~30s each")
        
        # Process each chunk through the audio-chunks logic (same as upload-recording)
        stt_service, _, _ = get_services()
        
        current_transcript = ""
        for idx, chunk in enumerate(chunks):
            print(f"[Upload Recording Try] Processing chunk {idx + 1}/{len(chunks)}")
            
            try:
                # Export chunk to webm format (same as upload-recording)
                chunk_buffer = io.BytesIO()
                chunk.export(chunk_buffer, format='webm')
                chunk_content = chunk_buffer.getvalue()
                
                # Transcribe using inline audio (same as upload-recording)
                print(f"[Upload Recording Try] Transcribing chunk {idx + 1}...")
                new_transcript_text = stt_service.transcribe_audio_chunk(chunk_content, use_gcs=False, gcs_uri=None)
                print(f"[Upload Recording Try] Chunk {idx + 1} transcription completed")
                
                if current_transcript:
                    current_transcript = current_transcript + '\n' + new_transcript_text
                else:
                    current_transcript = new_transcript_text
                
                print(f"[Upload Recording Try] Chunk {idx + 1} processed successfully")
                
            except Exception as e:
                print(f"[Upload Recording Try] Error processing chunk {idx + 1}: {str(e)}")
                return jsonify({
                    'error': f'Failed to process chunk {idx + 1}: {str(e)}',
                    'status': 'failed',
                    'chunksProcessed': idx
                }), 500
        
        print(f"[Upload Recording Try] All chunks processed successfully")
        
        if not current_transcript:
            return jsonify({'error': 'No transcript available to process', 'status': 'failed'}), 400
        
        # Process transcript to SOAP format
        print(f"[Upload Recording Try] Generating SOAP notes...")
        try:
            _, _, ai_service = get_services()
            soap_notes = ai_service.process_transcript_to_soap(current_transcript)
            print(f"[Upload Recording Try] SOAP notes generated successfully")
        except Exception as e:
            print(f"[Upload Recording Try] Error generating SOAP notes: {str(e)}")
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500
        
        soap_notes["version"] = "1"
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


@appointments_bp.route('/appointments/upload-notes-try', methods=['POST'])
def upload_notes_try():
    """
    POST /appointments/upload-notes-try
    Processes pasted appointment notes through SOAP format using LLM.
    No auth required.
    """
    try:
        # Check if file is in request
        if 'notes' not in request.form:
            return jsonify({'error': 'No appointment notes provided', 'status': 'failed'}), 400

        appointment_notes = request.form['notes']    
        print(f"[Appointment Notes] Starting processing for appointment")
        
        # Process transcript to SOAP format
        try:
            _, _, ai_service = get_services()
            soap_notes = ai_service.process_transcript_to_soap(appointment_notes)
            print(f"[Appointment Notes] SOAP notes generated successfully")
        except Exception as e:
            print(f"[Appointment Notes] Error generating SOAP notes: {str(e)}")
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500
        
        soap_notes["version"] = "1"
        new_title = soap_notes.get("title")
        
        return jsonify({
            'message': 'Recording uploaded and processed successfully',
            'soapNotes': soap_notes,
            'title':new_title,
            'status': 'Completed'
        }), 200
    
    except Exception as e:
        print(f"[Upload Recording] Unexpected error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500

@appointments_bp.route('/appointments/<appointment_id>/finalize', methods=['POST'])
@verify_firebase_token
def finalize_appointment(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/finalize
    Part 1: Uploads full audio to Cloud Storage (skipped if RecordingLink already exists)
    Part 2: Processes transcript into SOAP format using LLM
    """
    try:
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        
        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found'}), 404
        
        appointment_data = appointment_doc.to_dict()
        
        # Get services
        _, store_service, ai_service = get_services()
        
        # Check if recording already exists
        existing_recording_url = appointment_data.get('recordingLink', '')
        
        # PART 1: Upload full audio to Cloud Storage (only if not already uploaded)
        if existing_recording_url:
            # Recording already exists, skip upload
            recording_url = existing_recording_url
            print(f"Recording already exists for appointment {appointment_id}, skipping upload")
        else:
            # No existing recording, upload new audio
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
                appointment_ref.update({
                    'status': "Error",
                    'lastUpdated': datetime.utcnow().isoformat()
                })
                return jsonify({'error': f'Audio upload failed: {str(e)}'}), 500
        
  
        # PART 2: Process transcript to SOAP format
        raw_transcript = appointment_data.get('rawTranscript', '')
        
        if not raw_transcript:
            return jsonify({'error': 'No transcript available to process'}), 400
        
        try:
            soap_notes = ai_service.process_transcript_to_soap(raw_transcript)
        except Exception as e:
            return jsonify({'error': f'SOAP processing failed: {str(e)}'}), 500
        
        soap_notes["version"] = "1"
        # Update appointment in Firestore
        appointment_ref.update({
            'processedSummary': soap_notes,
            'status': 'Completed',
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()
        appointment_data = appointment_doc.to_dict()

        curr_title = appointment_data.get("title")
        new_title = soap_notes.get("title")
        if new_title and not curr_title:
            appointment_ref.update({
                'title': new_title
            })
        print(f"Current title: {str(curr_title)}, new title: {str(new_title)}")
        
        return jsonify({
            'message': 'Appointment finalized successfully',
            'appointmentId': appointment_id,
            'recordingLink': recording_url,
            'soapNotes': soap_notes,
            'status': 'Completed'
        }), 200
    
    except Exception as e:
        appointment_ref.update({
            'status': 'Error',
            'lastUpdated': datetime.utcnow().isoformat(),
        })
        return jsonify({'error': str(e)}), 500


@appointments_bp.route('/appointments/<appointment_id>', methods=['DELETE'])
@verify_firebase_token
def delete_appointment(user_id, appointment_id):
    """
    DELETE /appointments/{appointmentId}
    Deletes all associated storage files for the appointment
    """
    try:
        # Delete associated storage files
        _, storage_service, _ = get_services()
        
        # Delete recordings folder
        recordings_deleted = storage_service.delete_folder(f"recordings/{appointment_id}/")
        print(f"[Delete Appointment] Deleted {recordings_deleted} files from recordings/{appointment_id}/")
        
        # Delete chunks folder
        chunks_deleted = storage_service.delete_folder(f"chunks/{appointment_id}/")
        print(f"[Delete Appointment] Deleted {chunks_deleted} files from chunks/{appointment_id}/")
        
        return jsonify({
            'message': 'Storage files deleted successfully',
            'appointmentId': appointment_id,
            'filesDeleted': {
                'recordings': recordings_deleted,
                'chunks': chunks_deleted
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@appointments_bp.route('/appointments/search', methods=['GET'])
@verify_firebase_token
def search_appointments(user_id):
    """
    GET /appointments/search?q=[searchQuery]
    Searches for appointments by query in processed summary texts
    """
    try:
        search_query = request.args.get('q', '')
        
        if not search_query:
            return jsonify({'error': 'Search query parameter "q" is required'}), 400
        
        # Query Firestore for user's appointments using new schema
        appointments_ref = db.collection('users').document(user_id).collection('appointments')
        
        results = []
        
        # Iterate through user's appointments and search in ProcessedSummary
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
            
            # Check if search query is in the text
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


# =============================================================================
# New Decomposed APIs
# =============================================================================


@appointments_bp.route('/appointments', methods=['POST'])
@verify_firebase_token
def create_appointment(user_id):
    """
    POST /appointments
    Creates an empty appointment document in Firestore.
    Returns the new appointmentId.
    """
    try:
        # Create a new appointment document under the user's collection
        appointments_ref = db.collection('users').document(user_id).collection('appointments')
        new_appointment_ref = appointments_ref.document()  # auto-generated ID
        appointment_id = new_appointment_ref.id

        new_appointment_ref.set({
            'status': 'InProgress',
            'appointmentDate': datetime.utcnow().isoformat(),
            'createdDate': datetime.utcnow().isoformat(),
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        print(f"[Create Appointment] Created empty appointment {appointment_id} for user {user_id}")

        return jsonify({
            'message': 'Appointment created successfully',
            'appointmentId': appointment_id,
            'status': 'InProgress'
        }), 201

    except Exception as e:
        print(f"[Create Appointment] Error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@appointments_bp.route('/appointments/<appointment_id>/upload-recording-new', methods=['POST'])
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

        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()

        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404

        # Read audio content
        audio_content = audio_file.read()
        file_extension = audio_file.filename.split('.')[-1].lower() if audio_file.filename else 'webm'
        audio_size_mb = len(audio_content) / (1024 * 1024)
        print(f"[Upload Recording New] Received {audio_size_mb:.2f} MB, format: {file_extension}")

        # Upload full audio to GCS
        _, store_service, _ = get_services()
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        full_audio_filename = f"recordings/{appointment_id}/{timestamp}_full.{file_extension}"
        recording_gcs_uri = store_service.upload_file(
            audio_content, full_audio_filename, content_type=f'audio/{file_extension}'
        )
        print(f"[Upload Recording New] Uploaded to GCS: {recording_gcs_uri}")

        # Update appointment with the recording link
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


@appointments_bp.route('/appointments/<appointment_id>/upload-notes', methods=['POST'])
@verify_firebase_token
def upload_notes(user_id, appointment_id):
    """
    POST /appointments/{appointmentId}/upload-notes
    Stores plain text notes on the appointment document in Firestore.
    Accepts 'notes' from form data or JSON body.
    """
    try:
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()

        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404

        # Accept notes from form data or JSON body
        notes_text = request.form.get('notes', '')
        if not notes_text:
            json_data = request.get_json(silent=True)
            if json_data:
                notes_text = json_data.get('notes', '')

        if not notes_text:
            return jsonify({'error': 'No notes provided', 'status': 'failed'}), 400

        print(f"[Upload Notes] Storing {len(notes_text)} characters of notes for appointment {appointment_id}")

        # Store notes in Firestore
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


@appointments_bp.route('/appointments/<appointment_id>/upload-document', methods=['POST'])
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

        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc = appointment_ref.get()

        if not appointment_doc.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404

        # Read document content
        doc_content = doc_file.read()
        original_filename = doc_file.filename or 'document.pdf'
        doc_size_mb = len(doc_content) / (1024 * 1024)
        print(f"[Upload Document] Received {original_filename}: {doc_size_mb:.2f} MB")

        # Upload to GCS
        _, store_service, _ = get_services()
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        # Preserve original extension, default to pdf
        file_extension = original_filename.split('.')[-1].lower() if '.' in original_filename else 'pdf'
        gcs_filename = f"documents/{appointment_id}/{timestamp}_{original_filename}"
        document_gcs_uri = store_service.upload_file(
            doc_content, gcs_filename, content_type='application/pdf'
        )
        print(f"[Upload Document] Uploaded to GCS: {document_gcs_uri}")

        # Update appointment with the document link
        appointment_ref.update({
            'documentLink': document_gcs_uri,
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        return jsonify({
            'message': 'Document uploaded successfully',
            'appointmentId': appointment_id,
            'documentGcsUri': document_gcs_uri,
            'status': 'uploaded'
        }), 200

    except Exception as e:
        print(f"[Upload Document] Error: {str(e)}")
        return jsonify({'error': str(e), 'status': 'failed'}), 500


@appointments_bp.route('/appointments/<appointment_id>/process', methods=['POST'])
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
        # Verify appointment exists and belongs to user
        appointment_ref = db.collection('users').document(user_id).collection('appointments').document(appointment_id)
        appointment_doc_snap = appointment_ref.get()

        if not appointment_doc_snap.exists:
            return jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404

        appointment_data = appointment_doc_snap.to_dict()

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

        if not recording_gcs_uri and not notes_text and not document_gcs_uri:
            return jsonify({
                'error': 'At least one of recordingGcsUri, notes, or documentGcsUri must be provided',
                'status': 'failed'
            }), 400

        print(f"[Process] Starting processing for appointment {appointment_id}")
        print(f"[Process] Inputs - recording: {'yes' if recording_gcs_uri else 'no'}, "
              f"notes: {'yes' if notes_text else 'no'}, document: {'yes' if document_gcs_uri else 'no'}")

        # Store all references in Firebase
        update_fields: dict = {
            'lastUpdated': datetime.utcnow().isoformat(),
            'status': 'Processing',
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
        text_parts: list[str] = []

        # 1. Transcribe recording if provided
        if recording_gcs_uri:
            try:
                print(f"[Process] Downloading recording from GCS...")
                audio_content = store_service.download_file(recording_gcs_uri)
                # Detect file extension from the GCS URI
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
                    # Also store the raw transcript in Firestore
                    appointment_ref.update({
                        'rawTranscript': transcript,
                        'lastUpdated': datetime.utcnow().isoformat(),
                    })
                    print(f"[Process] Transcription complete: {len(transcript)} characters")
                else:
                    print(f"[Process] Warning: Transcription returned empty result")
            except Exception as e:
                print(f"[Process] Error transcribing recording: {str(e)}")
                appointment_ref.update({
                    'status': 'Error',
                    'lastUpdated': datetime.utcnow().isoformat(),
                })
                return jsonify({'error': f'Recording transcription failed: {str(e)}', 'status': 'failed'}), 500

        # 2. Add notes if provided
        if notes_text:
            text_parts.append(f"=== Patient/Provider Notes ===\n{notes_text}")
            print(f"[Process] Notes included: {len(notes_text)} characters")

        # 3. Extract text from PDF if provided
        if document_gcs_uri:
            try:
                print(f"[Process] Extracting text from PDF document...")
                pdf_text = extract_text_from_pdf_gcs(document_gcs_uri, store_service)
                if pdf_text:
                    text_parts.append(f"=== Document Content ===\n{pdf_text}")
                    print(f"[Process] PDF text extracted: {len(pdf_text)} characters")
                else:
                    print(f"[Process] Warning: PDF text extraction returned empty result")
            except Exception as e:
                print(f"[Process] Error extracting PDF text: {str(e)}")
                appointment_ref.update({
                    'status': 'Error',
                    'lastUpdated': datetime.utcnow().isoformat(),
                })
                return jsonify({'error': f'PDF text extraction failed: {str(e)}', 'status': 'failed'}), 500

        # Combine all text
        combined_text = "\n\n".join(text_parts)
        print(f"[Process] Combined text length: {len(combined_text)} characters")

        if not combined_text.strip():
            appointment_ref.update({
                'status': 'Error',
                'lastUpdated': datetime.utcnow().isoformat(),
            })
            return jsonify({'error': 'No text content available to process', 'status': 'failed'}), 400

        # Generate SOAP summary from combined text
        try:
            print(f"[Process] Generating SOAP summary...")
            soap_notes = generate_soap_from_text(combined_text, ai_service)
            print(f"[Process] SOAP summary generated successfully")
        except Exception as e:
            print(f"[Process] Error generating SOAP summary: {str(e)}")
            appointment_ref.update({
                'status': 'Error',
                'lastUpdated': datetime.utcnow().isoformat(),
            })
            return jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500

        # Update appointment with results
        appointment_ref.update({
            'processedSummary': soap_notes,
            'status': 'Completed',
            'lastUpdated': datetime.utcnow().isoformat(),
        })

        # Set title if not already set
        appointment_doc_snap = appointment_ref.get()
        appointment_data = appointment_doc_snap.to_dict()
        curr_title = appointment_data.get('title')
        new_title = soap_notes.get('title')
        if new_title and not curr_title:
            appointment_ref.update({'title': new_title})
        print(f"[Process] Current title: {str(curr_title)}, new title: {str(new_title)}")
        print(f"[Process] Appointment {appointment_id} processed successfully")

        return jsonify({
            'message': 'Appointment processed successfully',
            'appointmentId': appointment_id,
            'soapNotes': soap_notes,
            'status': 'Completed',
            'inputsProcessed': {
                'recording': bool(recording_gcs_uri),
                'notes': bool(notes_text),
                'document': bool(document_gcs_uri),
            }
        }), 200

    except Exception as e:
        print(f"[Process] Unexpected error: {str(e)}")
        try:
            appointment_ref.update({
                'status': 'Error',
                'lastUpdated': datetime.utcnow().isoformat(),
            })
        except Exception:
            pass
        return jsonify({'error': str(e), 'status': 'failed'}), 500
