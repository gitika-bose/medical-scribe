"""
Structured logging configuration for Google Cloud Logging integration.

On Cloud Run, JSON-formatted log lines written to stdout are automatically
ingested by Cloud Logging and fully searchable in the Google Cloud Console.

Each log entry includes:
- message        — the log message
- severity       — INFO, WARNING, ERROR, etc.
- session_id     — the X-Session-Id from the client (groups a user session)
- trace_id       — OpenTelemetry trace ID (links to Cloud Trace)
- span_id        — OpenTelemetry span ID
- logger         — Python logger name (module)

Usage:
    from logging_config import setup_logging
    setup_logging()  # call once at startup

    import logging
    logger = logging.getLogger(__name__)
    logger.info("Processing started", extra={"session_id": "abc-123"})
"""

import hashlib
import json
import logging
import os
import sys

from opentelemetry import trace


class SessionIdFilter(logging.Filter):
    """
    Logging filter that automatically injects session_id from Flask's g context.
    This means route code can simply call logger.info("message") without needing
    to pass extra={"session_id": ...} every time.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            from flask import g
            record.session_id = getattr(g, "session_id", None)
        except RuntimeError:
            # Outside Flask request context
            record.session_id = None
        return True


def _derive_appointment_trace_id(appointment_id: str) -> str:
    """
    Derive a stable 128-bit (32 hex char) trace ID from an appointment ID.

    Using MD5 here purely as a deterministic hash — not for security.
    The same appointment_id will always produce the same trace_id, so every
    Cloud Run log line for a given appointment shares one trace in Cloud Logging.
    """
    return hashlib.md5(appointment_id.encode()).hexdigest()


class StructuredJsonFormatter(logging.Formatter):
    """
    Formats log records as single-line JSON objects.

    Cloud Logging on Cloud Run automatically parses JSON from stdout and maps:
    - "severity" → Cloud Logging severity
    - "message"  → log text
    - "logging.googleapis.com/trace" → trace correlation
    - All other keys → searchable in jsonPayload.*

    Trace correlation strategy
    --------------------------
    Each HTTP request to Cloud Run gets its own random OpenTelemetry trace_id.
    That means logs from /upload-recording-new, /process, /finalize, etc. for
    the *same* appointment would each land in a different trace — making it hard
    to see all logs for an appointment at once in Cloud Logging.

    To fix this, when a session_id (= appointment_id) is present on the log
    record, we override `logging.googleapis.com/trace` with a *deterministic*
    trace ID derived from the appointment_id.  Every log line across every
    request for that appointment will therefore share a single stable trace,
    and you can query:

        trace="projects/<project>/traces/<md5_of_appointment_id>"

    in the Cloud Logging Logs Explorer to see all logs for one appointment.

    The real per-request OTel trace_id/span_id are still emitted as plain
    jsonPayload fields (trace_id / span_id) for request-level debugging.
    """

    def __init__(self):
        super().__init__()
        self.gcp_project_id = os.getenv("GCP_PROJECT_ID", "")

    def format(self, record: logging.LogRecord) -> str:
        # Base log entry
        log_entry: dict = {
            "severity": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }

        # Add session_id if present in the record's extra fields
        session_id = getattr(record, "session_id", None)
        if session_id:
            log_entry["session_id"] = session_id

        # Always capture the real per-request OTel trace/span IDs as raw fields
        # so individual request spans are still visible in Cloud Trace.
        span_context = trace.get_current_span().get_span_context()
        span_id_hex: str = ""
        if span_context and span_context.is_valid:
            trace_id_hex = format(span_context.trace_id, "032x")
            span_id_hex = format(span_context.span_id, "016x")
            log_entry["trace_id"] = trace_id_hex
            log_entry["span_id"] = span_id_hex

        # ---------------------------------------------------------------
        # Cloud Logging trace correlation
        # ---------------------------------------------------------------
        # When we have an appointment_id (session_id), derive a *stable*
        # trace ID from it so that ALL log lines for the same appointment
        # (across multiple HTTP requests) are grouped under one trace in
        # Cloud Logging, making per-appointment log queries trivial.
        # ---------------------------------------------------------------
        if self.gcp_project_id:
            if session_id:
                appt_trace_id = _derive_appointment_trace_id(session_id)
                # Expose the appointment-scoped trace ID as a plain field too
                log_entry["appointment_trace_id"] = appt_trace_id
                log_entry["logging.googleapis.com/trace"] = (
                    f"projects/{self.gcp_project_id}/traces/{appt_trace_id}"
                )
                # Keep the real per-request spanId for request-level linkage
                if span_id_hex:
                    log_entry["logging.googleapis.com/spanId"] = span_id_hex
            elif span_context and span_context.is_valid:
                # Non-appointment routes: fall back to the real OTel trace
                log_entry["logging.googleapis.com/trace"] = (
                    f"projects/{self.gcp_project_id}/traces/{trace_id_hex}"
                )
                log_entry["logging.googleapis.com/spanId"] = span_id_hex

        # Include exception info if present
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


def setup_logging():
    """
    Configure the root Python logger with structured JSON output.

    Call this once at application startup (before any logging is done).
    In production (Cloud Run), this outputs JSON to stdout.
    In development, it outputs human-readable formatted logs.
    """
    is_production = os.getenv("K_SERVICE") is not None

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove any existing handlers to avoid duplicate log lines
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)

    if is_production:
        handler.setFormatter(StructuredJsonFormatter())
    else:
        # Dev-friendly format that still shows session_id when present
        handler.setFormatter(logging.Formatter(
            "[%(asctime)s] %(levelname)s %(name)s — %(message)s"
        ))

    # Auto-inject session_id from Flask g context into every log record
    handler.addFilter(SessionIdFilter())

    root_logger.addHandler(handler)

    # Quieten noisy third-party loggers
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("google").setLevel(logging.WARNING)
    logging.getLogger("opentelemetry").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
