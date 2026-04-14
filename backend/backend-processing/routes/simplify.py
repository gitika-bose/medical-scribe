"""
Simplify route — medical document simplification pipeline.

POST /simplify
  Accepts: multipart/form-data with one or more 'files' fields
           (PDF, .txt, .docx, PNG, JPG, JPEG, WEBP)
  Returns: text/event-stream (SSE) with per-step progress + final result

SSE event schema (each line: "data: <json>\\n\\n"):
  { "step": 1, "status": "active", "label": "..." }
  { "step": 1, "status": "done",   "label": "..." }
  { "step": "result", "data": { ...structured output... } }
  { "step": "error",  "error": "..." }

Files are held in memory only — never written to GCS or Firestore.
"""

import io
import json
import logging

from flask import Blueprint, request, Response, stream_with_context

from utils.pdf_extract import extract_text_from_pdf
from utils.ocr import ocr_image
from utils.simplify_ai import SimplifyService
from utils.scoring import score_text

logger = logging.getLogger(__name__)

simplify_bp = Blueprint("simplify", __name__)

# ── Step metadata ─────────────────────────────────────────────────────────────
STEPS = {
    1: "Reading your document",
    2: "Identifying document type",
    3: "Simplifying language",
    4: "Adding explanations for medical terms",
    5: "Clarifying numbers and actions",
    6: "Organizing for clarity",
    7: "Generating follow-up questions",
}

ALLOWED_EXTENSIONS = {"pdf", "txt", "docx", "png", "jpg", "jpeg", "webp"}
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB per file
MAX_FILES = 10


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _sse(payload: dict) -> str:
    """Format a Python dict as an SSE data line."""
    return f"data: {json.dumps(payload)}\n\n"


def _extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, TXT, DOCX, or image bytes."""
    ext = filename.rsplit(".", 1)[1].lower()

    if ext == "txt":
        return file_bytes.decode("utf-8", errors="replace")

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)

    if ext == "docx":
        try:
            from docx import Document  # python-docx
        except ImportError:
            raise RuntimeError(
                "python-docx is not installed. Add 'python-docx' to requirements.txt."
            )
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    if ext in IMAGE_EXTENSIONS:
        return ocr_image(file_bytes)

    raise ValueError(f"Unsupported file extension: {ext}")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@simplify_bp.route("/simplify", methods=["POST"])
def simplify_document():
    """Stream simplification pipeline progress + result via SSE."""

    # ── Validate file uploads ─────────────────────────────────────────────────
    uploads = request.files.getlist("files")
    if not uploads:
        return {"error": "No files field in request"}, 400
    if len(uploads) > MAX_FILES:
        return {"error": f"Maximum {MAX_FILES} files allowed"}, 400

    file_parts: list[tuple[bytes, str]] = []
    for upload in uploads:
        if not upload.filename or not _allowed(upload.filename):
            return {"error": f"'{upload.filename}' is not a supported file type (PDF, TXT, DOCX, PNG, JPG, JPEG, WEBP)"}, 400
        file_bytes = upload.read()
        if len(file_bytes) > MAX_FILE_BYTES:
            return {"error": f"'{upload.filename}' exceeds 10 MB limit"}, 413
        file_parts.append((file_bytes, upload.filename))

    filenames = ", ".join(f for _, f in file_parts)
    logger.info("simplify: received %d file(s): %s", len(file_parts), filenames)

    # ── Stream generator ──────────────────────────────────────────────────────
    def generate():
        service = SimplifyService()

        try:
            # ── Step 1: Extract text from all files ───────────────────────────
            yield _sse({"step": 1, "status": "active", "label": STEPS[1]})
            text_parts: list[str] = []
            for file_bytes, filename in file_parts:
                try:
                    extracted = _extract_text(file_bytes, filename)
                    if extracted.strip():
                        text_parts.append(extracted)
                except Exception as exc:
                    logger.exception("simplify: text extraction failed for '%s'", filename)
                    yield _sse({"step": "error", "error": f"Could not read '{filename}': {exc}"})
                    return
            text = "\n\n---\n\n".join(text_parts)
            if not text.strip():
                yield _sse({"step": "error", "error": "Files appear to be empty or unreadable."})
                return
            yield _sse({"step": 1, "status": "done", "label": STEPS[1]})

            # ── Score original text (silent — no SSE event) ───────────────────
            try:
                before_score = score_text(text)
            except Exception:
                logger.exception("simplify: before-score failed — continuing without score")
                before_score = None

            # ── Step 2: Classify document type ────────────────────────────────
            yield _sse({"step": 2, "status": "active", "label": STEPS[2]})
            try:
                classification = service.classify_document(text)
                doc_type = classification.get("doc_type", "appointment_note")
            except Exception:
                logger.exception("simplify: document classification failed — defaulting to appointment_note")
                doc_type = "appointment_note"
            yield _sse({"step": 2, "status": "done", "label": STEPS[2]})

            # ── Detect jargon (silent) ────────────────────────────────────────
            try:
                jargon_result = service.detect_jargon(text)
                medical_jargon = jargon_result["medical_jargon"]
                complex_terms  = jargon_result["complex_terms"]
            except Exception:
                logger.exception("simplify: jargon detection failed — continuing without jargon data")
                medical_jargon = []
                complex_terms  = []

            # ── Step 3: Simplify language ─────────────────────────────────────
            yield _sse({"step": 3, "status": "active", "label": STEPS[3]})
            try:
                simplified = service.simplify_language(text, medical_jargon, complex_terms)
            except Exception as exc:
                logger.exception("simplify: language simplification failed")
                yield _sse({"step": "error", "error": f"Simplification failed: {exc}"})
                return
            yield _sse({"step": 3, "status": "done", "label": STEPS[3]})

            # ── Step 4: Add definitions ───────────────────────────────────────
            yield _sse({"step": 4, "status": "active", "label": STEPS[4]})
            try:
                with_defs = service.add_definitions(simplified, medical_jargon)
            except Exception as exc:
                logger.exception("simplify: definition injection failed — using simplified text")
                with_defs = simplified
            yield _sse({"step": 4, "status": "done", "label": STEPS[4]})

            # ── Step 5: Clarify numbers and actions ───────────────────────────
            yield _sse({"step": 5, "status": "active", "label": STEPS[5]})
            try:
                clarified = service.clarify_and_action(with_defs)
            except Exception as exc:
                logger.exception("simplify: clarification step failed — using previous output")
                clarified = with_defs
            yield _sse({"step": 5, "status": "done", "label": STEPS[5]})

            # ── Score simplified text (silent — no SSE event) ─────────────────
            try:
                after_score = score_text(clarified)
            except Exception:
                logger.exception("simplify: after-score failed — continuing without score")
                after_score = None

            # ── Steps 6 + 7: Structure + questions ───────────────────────────
            yield _sse({"step": 6, "status": "active", "label": STEPS[6]})
            yield _sse({"step": 7, "status": "active", "label": STEPS[7]})
            try:
                structured = service.structure_document(clarified, medical_jargon, doc_type)
            except Exception as exc:
                logger.exception("simplify: document structuring failed")
                yield _sse({"step": "error", "error": f"Structuring failed: {exc}"})
                return
            yield _sse({"step": 6, "status": "done", "label": STEPS[6]})
            yield _sse({"step": 7, "status": "done", "label": STEPS[7]})

            # ── Final result ──────────────────────────────────────────────────
            result_payload = {**structured}
            if before_score is not None:
                result_payload["before_score"] = before_score
            if after_score is not None:
                result_payload["after_score"] = after_score
            yield _sse({"step": "result", "data": result_payload})

        except Exception as exc:
            logger.exception("simplify: unexpected pipeline error")
            yield _sse({"step": "error", "error": f"Pipeline error: {exc}"})

    return Response(
        stream_with_context(generate()),
        content_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",   # disable nginx buffering
            "Connection":       "keep-alive",
        },
    )
