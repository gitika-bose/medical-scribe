"""
Shared services and helper functions used across all route modules.

Provides:
- Firestore database initialization
- Lazy service initialization (STT, Storage, Vertex AI)
- Common appointment helpers (get, error handling, title updates)
- Audio processing utilities (chunking, transcription)
"""

from datetime import datetime
from flask import jsonify
from utils.speech_to_text import SpeechToTextService
from utils.storage import StorageService
from utils.vertex_ai import VertexAIService
from utils.constants import Constants
from config import initialize_firebase, GCP_PROJECT_ID, GCP_BUCKET_NAME, GCP_LOCATION, VERTEX_AI_MODEL
import io
from pydub import AudioSegment

# Initialize Firestore
db = initialize_firebase()

# Initialize services (lazy initialization to avoid errors if env vars not set)
_speech_service = None
_storage_service = None
_vertex_ai_service = None


def get_services():
    """Lazy initialization of GCP services. Returns (speech_service, storage_service, vertex_ai_service)."""
    global _speech_service, _storage_service, _vertex_ai_service

    if _speech_service is None:
        _speech_service = SpeechToTextService()
    if _storage_service is None:
        _storage_service = StorageService(GCP_BUCKET_NAME, GCP_PROJECT_ID)
    if _vertex_ai_service is None:
        _vertex_ai_service = VertexAIService(GCP_PROJECT_ID, GCP_LOCATION, VERTEX_AI_MODEL)

    return _speech_service, _storage_service, _vertex_ai_service


# ---------------------------------------------------------------------------
# Firestore helpers
# ---------------------------------------------------------------------------

def get_appointment_ref(user_id, appointment_id):
    """Return a Firestore document reference for the given appointment."""
    return db.collection('users').document(user_id).collection('appointments').document(appointment_id)


def get_appointment_or_404(user_id, appointment_id):
    """
    Fetch an appointment document.

    Returns:
        (appointment_ref, appointment_data, None) on success.
        (None, None, (json_response, status_code)) if the appointment does not exist.
    """
    appointment_ref = get_appointment_ref(user_id, appointment_id)
    appointment_doc = appointment_ref.get()

    if not appointment_doc.exists:
        return None, None, (jsonify({'error': 'Appointment not found', 'status': 'failed'}), 404)

    return appointment_ref, appointment_doc.to_dict(), None


def set_appointment_error(appointment_ref):
    """Set an appointment's status to 'Error' with a timestamp. Silently ignores failures."""
    try:
        appointment_ref.update({
            'status': 'Error',
            'lastUpdated': datetime.utcnow().isoformat()
        })
    except Exception:
        pass


def update_title_if_empty(appointment_ref, soap_notes):
    """Set the appointment title from SOAP notes if the appointment doesn't already have one."""
    appointment_doc = appointment_ref.get()
    appointment_data = appointment_doc.to_dict()
    curr_title = appointment_data.get('title')
    new_title = soap_notes.get('title')
    if new_title and not curr_title:
        appointment_ref.update({'title': new_title})
    print(f"Current title: {str(curr_title)}, new title: {str(new_title)}")


# ---------------------------------------------------------------------------
# SOAP generation helper
# ---------------------------------------------------------------------------

def generate_soap_and_finalize(appointment_ref, raw_transcript, ai_service, schema_version=Constants.SUMMARY_SCHEMA_VERSION_1_2):
    """
    Generate SOAP notes from a transcript and mark the appointment as Completed.

    Returns:
        (soap_notes, None) on success.
        (None, (json_response, status_code)) on failure.
    """
    if not raw_transcript:
        set_appointment_error(appointment_ref)
        return None, (jsonify({'error': 'No transcript available to process', 'status': 'failed'}), 400)

    try:
        soap_notes = ai_service.process_transcript_to_soap(raw_transcript, schema_version=schema_version)
        print(f"SOAP notes generated successfully")
    except Exception as e:
        print(f"Error generating SOAP notes: {str(e)}")
        set_appointment_error(appointment_ref)
        return None, (jsonify({'error': f'SOAP processing failed: {str(e)}', 'status': 'failed'}), 500)

    soap_notes["version"] = schema_version

    appointment_ref.update({
        'processedSummary': soap_notes,
        'status': 'Completed',
        'lastUpdated': datetime.utcnow().isoformat(),
    })

    update_title_if_empty(appointment_ref, soap_notes)

    return soap_notes, None


# ---------------------------------------------------------------------------
# Audio processing helpers
# ---------------------------------------------------------------------------

def detect_file_extension(filename):
    """Extract file extension from a filename, defaulting to 'webm'."""
    if filename and '.' in filename:
        return filename.split('.')[-1].lower()
    return 'webm'


def split_audio_to_webm_chunks(audio_content, file_extension, chunk_length_ms=30000):
    """
    Load raw audio bytes and split into webm-encoded chunks.

    Args:
        audio_content: Raw audio file bytes.
        file_extension: Format hint for pydub (e.g. 'webm', 'mp3').
        chunk_length_ms: Chunk duration in milliseconds (default 30 s).

    Returns:
        List of bytes, each being a webm-encoded audio chunk.

    Raises:
        Exception if the audio cannot be loaded or converted.
    """
    audio = AudioSegment.from_file(io.BytesIO(audio_content), format=file_extension)
    print(f"Audio loaded: duration={len(audio)}ms, channels={audio.channels}, frame_rate={audio.frame_rate}")

    chunks = []
    for i in range(0, len(audio), chunk_length_ms):
        chunk = audio[i:i + chunk_length_ms]
        chunk_buffer = io.BytesIO()
        chunk.export(chunk_buffer, format='webm')
        chunks.append(chunk_buffer.getvalue())

    print(f"Split audio into {len(chunks)} chunks of ~{chunk_length_ms // 1000}s each")
    return chunks


def transcribe_chunks(chunks, stt_service):
    """
    Transcribe a list of audio chunk byte arrays and combine into a single transcript.

    This is used by endpoints that do NOT need per-chunk GCS upload or Firestore updates
    (e.g. the "try" / demo endpoints).

    Returns:
        Combined transcript string.
    """
    transcript_parts = []
    for idx, chunk_content in enumerate(chunks):
        print(f"Transcribing chunk {idx + 1}/{len(chunks)}...")
        text = stt_service.transcribe_audio_chunk(chunk_content, use_gcs=False, gcs_uri=None)
        print(f"Chunk {idx + 1} transcription completed")
        if text:
            transcript_parts.append(text)
    return '\n'.join(transcript_parts)


def parse_notes_from_request(request):
    """
    Extract notes text from a Flask request, checking form data first then JSON body.

    Returns:
        The notes string (may be empty).
    """
    notes_text = request.form.get('notes', '')
    if not notes_text:
        json_data = request.get_json(silent=True)
        if json_data:
            notes_text = json_data.get('notes', '') or json_data.get('transcript', '')
    return notes_text
