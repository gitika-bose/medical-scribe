"""
Reusable processing helper functions extracted from appointment routes.
These functions handle audio transcription, SOAP generation, PDF text extraction,
and OCR for image-based documents.
"""
import io
import logging
from pydub import AudioSegment
from utils.speech_to_text import SpeechToTextService
from utils.storage import StorageService
from utils.vertex_ai import VertexAIService
from utils.pdf_extract import extract_text_from_pdf
from utils.ocr import ocr_image, ocr_pdf, ocr_pdf_gcs
from utils.constants import Constants

logger = logging.getLogger(__name__)

# File extensions recognised as direct images (not PDFs)
_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg'}


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


def _get_file_extension(gcs_uri: str) -> str:
    """Extract the lowercase file extension (including dot) from a GCS URI."""
    if '.' in gcs_uri.rsplit('/', 1)[-1]:
        return '.' + gcs_uri.rsplit('.', 1)[-1].lower()
    return ''


def extract_text_from_pdf_gcs(gcs_uri: str, storage_service: StorageService) -> str:
    """
    Download a PDF from GCS and extract its text content.
    Falls back to OCR if the PDF has no embedded text layer.

    Args:
        gcs_uri: GCS URI of the PDF file (gs://bucket/path)
        storage_service: Initialized StorageService instance

    Returns:
        Extracted text from the PDF
    """
    logger.info("[PDF] Downloading PDF from GCS: %s", gcs_uri)
    pdf_bytes = storage_service.download_file(gcs_uri)
    logger.info("[PDF] Downloaded %d bytes", len(pdf_bytes))

    # 1. Try normal text extraction (embedded text layer)
    text = extract_text_from_pdf(pdf_bytes)

    # 2. If no text found, fall back to OCR
    if not text.strip():
        logger.info("[PDF] No embedded text found — falling back to OCR")
        try:
            text = ocr_pdf(pdf_bytes)
        except Exception as ocr_err:
            logger.warning("[PDF] Sync OCR failed (%s), trying async GCS OCR...", str(ocr_err))
            # Fall back to async GCS-based OCR for large PDFs
            import uuid
            bucket_name = gcs_uri.split('/')[2]  # gs://bucket-name/...
            output_prefix = f"gs://{bucket_name}/ocr-output/{uuid.uuid4()}/"
            text = ocr_pdf_gcs(gcs_uri, output_prefix)

    return text


def extract_text_from_document_gcs(gcs_uri: str, storage_service: StorageService) -> str:
    """
    Download a document (PDF or image) from GCS and extract its text content.

    For PDFs:  Tries PyPDF2 first, falls back to Vision OCR if no embedded text.
    For images: Uses Vision OCR directly.

    Args:
        gcs_uri: GCS URI of the document (gs://bucket/path)
        storage_service: Initialized StorageService instance

    Returns:
        Extracted text from the document
    """
    ext = _get_file_extension(gcs_uri)

    if ext in _IMAGE_EXTENSIONS:
        # Direct image upload — OCR it
        logger.info("[Document] Image detected (%s), downloading for OCR: %s", ext, gcs_uri)
        image_bytes = storage_service.download_file(gcs_uri)
        logger.info("[Document] Downloaded %d bytes", len(image_bytes))
        text = ocr_image(image_bytes)
        logger.info("[Document] Image OCR extracted %d characters", len(text))
        return text

    # Default: treat as PDF (handles .pdf and any unknown extensions)
    return extract_text_from_pdf_gcs(gcs_uri, storage_service)
