from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.auth import verify_firebase_token
from utils.speech_to_text import SpeechToTextService
from utils.storage import StorageService
from utils.vertex_ai import VertexAIService
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
        existing_recording_url = appointment_data.get('RecordingLink', '')
        
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
