"""
Routes package — registers all API blueprints.

Modules:
- services.py          — Shared infrastructure (DB, services, helpers)
- appointments_crud.py — Create, delete, search, health check
- audio.py             — Audio upload, chunking, transcription, finalize
- processing.py        — AI processing, questions, notes, documents
- try_endpoints.py     — Unauthenticated demo endpoints
"""

from routes.appointments_crud import appointments_crud_bp
from routes.audio import audio_bp
from routes.processing import processing_bp
from routes.try_endpoints import try_bp

all_blueprints = [
    appointments_crud_bp,
    audio_bp,
    processing_bp,
    try_bp,
]
