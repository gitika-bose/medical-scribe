"""
Reusable processing helper functions extracted from appointment routes.
These functions handle audio transcription, SOAP generation, and PDF text extraction.
"""
import io
from pydub import AudioSegment
from utils.speech_to_text import SpeechToTextService
from utils.storage import StorageService
from utils.vertex_ai import VertexAIService
from utils.pdf_extract import extract_text_from_pdf
from utils.constants import Constants


def transcribe_full_recording(
    audio_content: bytes,
    file_extension: str,
    stt_service: SpeechToTextService,
) -> str:
    """
    Split a full recording into 30-second chunks, transcribe each chunk,
    and return the combined transcript.

    Args:
        audio_content: Raw audio file bytes
        file_extension: Audio format extension (e.g. 'webm', 'mp3', 'm4a')
        stt_service: Initialized SpeechToTextService instance

    Returns:
        Combined transcript string
    """

    # Load audio using pydub
    audio = AudioSegment.from_file(io.BytesIO(audio_content), format=file_extension)
    print(f"[Transcribe] Audio loaded: duration={len(audio)}ms, channels={audio.channels}, frame_rate={audio.frame_rate}")

    # Split audio into 30-second chunks
    chunk_length_ms = 30 * 1000
    chunks: list[AudioSegment] = []
    for i in range(0, len(audio), chunk_length_ms):
        chunks.append(audio[i:i + chunk_length_ms])

    print(f"[Transcribe] Split audio into {len(chunks)} chunks of ~30s each")

    transcript_parts: list[str] = []

    for idx, chunk in enumerate(chunks):
        print(f"[Transcribe] Processing chunk {idx + 1}/{len(chunks)}")

        # Export chunk to webm
        chunk_buffer = io.BytesIO()
        chunk.export(chunk_buffer, format='webm')
        chunk_content = chunk_buffer.getvalue()

        # Transcribe using inline audio
        new_text = stt_service.transcribe_audio_chunk(chunk_content, use_gcs=False, gcs_uri=None)
        print(f"[Transcribe] Chunk {idx + 1} transcription completed")

        if new_text:
            transcript_parts.append(new_text)

    full_transcript = "\n".join(transcript_parts)
    print(f"[Transcribe] Full transcript length: {len(full_transcript)} characters")
    return full_transcript


def transcribe_recording_batch(
    recording_gcs_uri: str,
    stt_service: SpeechToTextService,
    storage_service: StorageService = None,
) -> str:
    """
    Transcribe a full recording using V1 LongRunningRecognize.
    The audio stays in GCS — no chunking needed.

    If the audio format is not natively supported by Speech-to-Text (e.g. m4a),
    it will be downloaded, converted to FLAC via ffmpeg, re-uploaded, and then
    transcribed.  A ``storage_service`` must be provided for this conversion.

    Args:
        recording_gcs_uri: GCS URI of the full recording (e.g. gs://bucket/recordings/id/full.webm)
        stt_service: Initialized SpeechToTextService instance
        storage_service: Initialized StorageService instance (required for m4a/mp4 conversion)

    Returns:
        Combined transcript string
    """
    print(f"[Transcribe Batch] Starting batch transcription for: {recording_gcs_uri}")
    transcript = stt_service.batch_transcribe(
        recording_gcs_uri,
        storage_service=storage_service,
    )
    print(f"[Transcribe Batch] Full transcript length: {len(transcript)} characters")
    return transcript


def generate_soap_from_text(text: str, ai_service: VertexAIService, schema_version: str = Constants.SUMMARY_SCHEMA_VERSION_1_3) -> dict:
    """
    Generate SOAP-format summary from combined text using Vertex AI.

    Args:
        text: Combined text from transcripts, notes, and/or PDF content
        ai_service: Initialized VertexAIService instance

    Returns:
        Dictionary with SOAP-structured notes (includes 'version' key)
    """
    soap_notes = ai_service.process_transcript_to_soap(text, schema_version=schema_version)
    soap_notes["version"] = schema_version
    print(f"[SOAP] Generated SOAP notes successfully")
    return soap_notes


def extract_text_from_pdf_gcs(gcs_uri: str, storage_service: StorageService) -> str:
    """
    Download a PDF from GCS and extract its text content.

    Args:
        gcs_uri: GCS URI of the PDF file (gs://bucket/path)
        storage_service: Initialized StorageService instance

    Returns:
        Extracted text from the PDF
    """
    print(f"[PDF] Downloading PDF from GCS: {gcs_uri}")
    pdf_bytes = storage_service.download_file(gcs_uri)
    print(f"[PDF] Downloaded {len(pdf_bytes)} bytes")
    text = extract_text_from_pdf(pdf_bytes)
    return text
