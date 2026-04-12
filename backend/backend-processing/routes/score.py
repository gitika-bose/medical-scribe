"""
Score route — Patient Accessibility Score endpoint.

POST /score — score text or a file upload; returns PatientScore JSON

Accepts:
  - application/json:       {"text": "..."}
  - multipart/form-data:    file field (PDF, .txt, .docx) — reuses _extract_text
"""

import logging

from flask import Blueprint, jsonify, request

from utils.scoring import score_text
from routes.simplify import _extract_text, _allowed, MAX_FILE_BYTES

logger = logging.getLogger(__name__)

score_bp = Blueprint("score", __name__)


@score_bp.route("/score", methods=["POST"])
def score_document():
    """Score a document for patient accessibility."""

    if request.content_type and "multipart" in request.content_type:
        if "file" not in request.files:
            return jsonify({"error": "No file field in request"}), 400
        upload = request.files["file"]
        if not upload.filename or not _allowed(upload.filename):
            return jsonify({"error": "File must be PDF, TXT, or DOCX"}), 400
        file_bytes = upload.read()
        if len(file_bytes) > MAX_FILE_BYTES:
            return jsonify({"error": "File exceeds 10 MB limit"}), 413
        try:
            text = _extract_text(file_bytes, upload.filename)
        except Exception as exc:
            logger.exception("score: text extraction failed")
            return jsonify({"error": f"Could not read file: {exc}"}), 422
    else:
        body = request.get_json(silent=True) or {}
        text = body.get("text", "")

    if not text or not text.strip():
        return jsonify({"error": "No text content found"}), 400

    result = score_text(text)
    if result is None:
        return jsonify({"error": "Text is empty"}), 400

    logger.info("score: composite=%d words=%d", result["composite"], result["word_count"])
    return jsonify(result)
