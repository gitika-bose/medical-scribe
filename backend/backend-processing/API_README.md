# Medical Scribe — Backend Processing API

Full specification for the Flask backend that powers appointment creation, audio transcription, document processing, AI-powered SOAP note generation, and question generation.

**Base URL:** `http://localhost:8080` (development) or your deployed Cloud Run URL.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Authentication](#authentication)
3. [Endpoints Overview](#endpoints-overview)
4. [File Descriptions](#file-descriptions)
5. [Detailed Endpoint Reference](#detailed-endpoint-reference)
   - [Health & Info](#health--info)
   - [Appointment CRUD](#appointment-crud)
   - [Audio Upload & Transcription](#audio-upload--transcription)
   - [AI Processing & Documents](#ai-processing--documents)
   - [Try / Demo Endpoints (No Auth)](#try--demo-endpoints-no-auth)
6. [Shared Services & Helpers](#shared-services--helpers)
7. [Error Handling](#error-handling)

---

## Project Structure

```
backend-processing/
├── app.py                        # Flask application entry point
├── config.py                     # Environment variables & Firebase init
├── routes/
│   ├── __init__.py               # Blueprint registry (all_blueprints)
│   ├── services.py               # Shared DB, services, helpers
│   ├── appointments_crud.py      # Create, delete, search, health
│   ├── audio.py                  # Audio chunk upload, recording upload, finalize
│   ├── processing.py             # AI processing, questions, notes, documents
│   └── try_endpoints.py          # Unauthenticated demo endpoints
├── utils/
│   ├── auth.py                   # Firebase token verification decorator
│   ├── speech_to_text.py         # Google Speech-to-Text service wrapper
│   ├── storage.py                # Google Cloud Storage service wrapper
│   ├── vertex_ai.py              # Vertex AI (Gemini) service wrapper
│   ├── processing.py             # Audio transcription & SOAP helper functions
│   └── pdf_extract.py            # PDF text extraction
├── requirements.txt
└── Dockerfile
```

---

## Authentication

All endpoints marked **🔒 Auth Required** expect a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

The `verify_firebase_token` decorator extracts and validates the token, then injects `user_id` as the first argument to the route handler. Unauthenticated endpoints (the "try" endpoints) require no token.

---

## Endpoints Overview

| Method | Path | Auth | File | Description |
|--------|------|------|------|-------------|
| `GET` | `/` | No | `app.py` | API info & version |
| `GET` | `/health` | No | `appointments_crud.py` | Service health check |
| `POST` | `/appointments` | 🔒 | `appointments_crud.py` | Create appointment |
| `DELETE` | `/appointments/{id}` | 🔒 | `appointments_crud.py` | Delete appointment files |
| `GET` | `/appointments/search` | 🔒 | `appointments_crud.py` | Search appointments |
| `POST` | `/appointments/{id}/audio-chunks` | 🔒 | `audio.py` | Upload & transcribe audio chunk |
| `POST` | `/appointments/{id}/upload-recording` | 🔒 | `audio.py` | Legacy: full recording → chunk → transcribe → SOAP |
| `POST` | `/appointments/{id}/upload-recording-new` | 🔒 | `audio.py` | Upload recording to GCS only |
| `POST` | `/appointments/{id}/finalize` | 🔒 | `audio.py` | Upload audio + generate SOAP |
| `POST` | `/appointments/{id}/generate-questions` | 🔒 | `processing.py` | Generate questions from transcript |
| `POST` | `/appointments/{id}/upload-notes` | 🔒 | `processing.py` | Store text notes on appointment |
| `POST` | `/appointments/{id}/upload-document` | 🔒 | `processing.py` | Upload PDF to GCS |
| `POST` | `/appointments/{id}/process` | 🔒 | `processing.py` | Combined processor (transcribe + PDF + SOAP) |
| `POST` | `/appointments/generate-questions-try` | No | `try_endpoints.py` | Demo: generate questions |
| `POST` | `/appointments/upload-recording-try` | No | `try_endpoints.py` | Demo: recording → SOAP |
| `POST` | `/appointments/upload-notes-try` | No | `try_endpoints.py` | Demo: notes → SOAP |

---

## File Descriptions

### `routes/services.py` — Shared Infrastructure

Contains all shared state and helper functions used across route modules:

| Export | Purpose |
|--------|---------|
| `db` | Firestore database client instance |
| `get_services()` | Lazy-initializes and returns `(SpeechToTextService, StorageService, VertexAIService)` |
| `get_appointment_ref(user_id, id)` | Returns a Firestore document reference |
| `get_appointment_or_404(user_id, id)` | Fetches appointment data or returns a 404 error tuple |
| `set_appointment_error(ref)` | Sets appointment status to `"Error"` |
| `update_title_if_empty(ref, soap)` | Sets title from SOAP notes if appointment has none |
| `generate_soap_and_finalize(ref, transcript, ai)` | Generates SOAP notes, sets status to `"Completed"`, updates title |
| `detect_file_extension(filename)` | Extracts extension from filename (defaults to `"webm"`) |
| `split_audio_to_webm_chunks(content, ext)` | Splits audio bytes into 30 s webm-encoded chunks via pydub |
| `transcribe_chunks(chunks, stt)` | Transcribes a list of audio chunks (used by demo endpoints) |
| `parse_notes_from_request(request)` | Extracts notes/transcript text from form data or JSON body |

### `routes/appointments_crud.py` — CRUD & Lifecycle

Simple create/delete/search operations with minimal processing logic.

### `routes/audio.py` — Audio Upload & Transcription

Handles all audio-related workflows: single chunk upload, full recording upload with chunking, GCS-only upload, and finalization (audio upload + SOAP generation).

### `routes/processing.py` — AI Processing & Documents

The "smart" endpoints: combined multi-input processing (recording + notes + PDF → SOAP), question generation, note storage, and document upload.

### `routes/try_endpoints.py` — Demo Endpoints

Self-contained demo versions of the authenticated endpoints. No auth, no Firestore, no GCS storage. Used by the public landing page.

---

## Detailed Endpoint Reference

### Health & Info

#### `GET /`
Returns API name, version, and available endpoints.

**Response:**
```json
{
  "name": "Medical Scribe Processing API",
  "version": "1.1.0",
  "endpoints": { ... }
}
```

#### `GET /health`
Quick health check to verify the service is online.

**Response:**
```json
{
  "status": "healthy",
  "service": "backend-processing",
  "timestamp": "2025-01-15T10:30:00.000000"
}
```

---

### Appointment CRUD

#### `POST /appointments` 🔒
Creates an empty appointment document in Firestore.

**Input:** None (auth token only)

**Response (201):**
```json
{
  "message": "Appointment created successfully",
  "appointmentId": "auto-generated-id",
  "status": "InProgress"
}
```

**Firestore fields set:** `status`, `appointmentDate`, `createdDate`, `lastUpdated`

---

#### `DELETE /appointments/{appointmentId}` 🔒
Deletes all GCS storage files associated with the appointment (recordings + audio chunks). Does NOT delete the Firestore document (that is handled client-side).

**Input:** None (path parameter only)

**Response (200):**
```json
{
  "message": "Storage files deleted successfully",
  "appointmentId": "abc123",
  "filesDeleted": {
    "recordings": 2,
    "chunks": 5
  }
}
```

---

#### `GET /appointments/search?q={query}` 🔒
Searches all of the user's appointments by looking for the query string in the SOAP summary fields (Subjective, Objective, Assessment, Plan, OtherNotes).

**Input:** Query parameter `q` (required)

**Response (200):**
```json
{
  "query": "headache",
  "results": [
    {
      "appointmentId": "abc123",
      "createdDate": "2025-01-15T10:30:00",
      "status": "Completed"
    }
  ],
  "count": 1
}
```

---

### Audio Upload & Transcription

#### `POST /appointments/{appointmentId}/audio-chunks` 🔒
Processes a single audio chunk: uploads to GCS for backup, transcribes using Google STT, and appends the result to `rawTranscript` in Firestore.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audioChunk` | file | ✅ | Audio chunk file (webm) |

**Response (200):**
```json
{
  "status": "uploaded",
  "message": "Audio chunk processed and transcript updated",
  "transcriptLength": 1234
}
```

**Side effects:** Uploads chunk to `gs://bucket/chunks/{appointmentId}/{uuid}.webm`, updates `rawTranscript` and `lastUpdated` in Firestore.

---

#### `POST /appointments/{appointmentId}/upload-recording` 🔒 *(Legacy)*
All-in-one endpoint: uploads a full recording, splits it into 30-second chunks, transcribes each chunk (with GCS backup), uploads the full audio, and generates SOAP notes.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recording` | file | ✅ | Full audio recording file |

**Response (200):**
```json
{
  "message": "Recording uploaded and processed successfully",
  "appointmentId": "abc123",
  "recordingLink": "gs://bucket/recordings/abc123/...",
  "soapNotes": { ... },
  "status": "Completed",
  "chunksProcessed": 5
}
```

**Side effects:** Uploads chunks to GCS, uploads full audio, updates `rawTranscript`, `recordingLink`, `processedSummary`, `status`, and `title` in Firestore.

---

#### `POST /appointments/{appointmentId}/upload-recording-new` 🔒
Uploads a recording to GCS **without** processing. Transcription and SOAP generation are handled separately by the `/process` endpoint.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recording` | file | ✅ | Audio recording file |

**Response (200):**
```json
{
  "message": "Recording uploaded successfully",
  "appointmentId": "abc123",
  "recordingGcsUri": "gs://bucket/recordings/abc123/...",
  "status": "uploaded"
}
```

**Side effects:** Uploads to GCS, sets `recordingLink` in Firestore.

---

#### `POST /appointments/{appointmentId}/finalize` 🔒
Two-part finalization:
1. Uploads full audio to GCS (skipped if `recordingLink` already exists)
2. Generates SOAP notes from the existing `rawTranscript`

**Input:** `multipart/form-data` (optional)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullAudio` | file | Conditional | Required only if no `recordingLink` exists |

**Response (200):**
```json
{
  "message": "Appointment finalized successfully",
  "appointmentId": "abc123",
  "recordingLink": "gs://bucket/recordings/abc123/...",
  "soapNotes": { ... },
  "status": "Completed"
}
```

---

### AI Processing & Documents

#### `POST /appointments/{appointmentId}/generate-questions` 🔒
Generates 2-3 potential follow-up questions based on the current transcript using Vertex AI.

**Input:** None (reads `rawTranscript` from Firestore)

**Response (200):**
```json
{
  "questions": [
    "How long have you been experiencing these symptoms?",
    "Have you tried any medications for this?"
  ],
  "message": "Questions generated successfully"
}
```

---

#### `POST /appointments/{appointmentId}/upload-notes` 🔒
Stores plain text notes on the appointment document.

**Input:** `multipart/form-data` or `application/json`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | ✅ | Plain text appointment notes |

**Response (200):**
```json
{
  "message": "Notes uploaded successfully",
  "appointmentId": "abc123",
  "notesLength": 456,
  "status": "uploaded"
}
```

---

#### `POST /appointments/{appointmentId}/upload-document` 🔒
Uploads a PDF document to GCS. Text extraction happens later via the `/process` endpoint.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | file | ✅ | PDF document |

**Response (200):**
```json
{
  "message": "Document uploaded successfully",
  "appointmentId": "abc123",
  "documentGcsUri": "gs://bucket/documents/abc123/...",
  "status": "uploaded"
}
```

---

#### `POST /appointments/{appointmentId}/process` 🔒
**The main processing endpoint.** Accepts any combination of recording GCS URI, notes text, and/or document GCS URI. Falls back to values already stored on the appointment. Processes all inputs together:
1. Downloads & transcribes recording (if provided)
2. Includes notes text (if provided)
3. Extracts text from PDF document (if provided)
4. Combines all text sources
5. Generates SOAP summary via Vertex AI

**Input:** `application/json` or `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recordingGcsUri` | string | Optional | GCS URI of the recording |
| `notes` | string | Optional | Plain text notes |
| `documentGcsUri` | string | Optional | GCS URI of the PDF document |

*At least one must be provided (or already stored on the appointment).*

**Response (200):**
```json
{
  "message": "Appointment processed successfully",
  "appointmentId": "abc123",
  "soapNotes": {
    "title": "Follow-up for chronic headaches",
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "...",
    "version": "1"
  },
  "status": "Completed",
  "inputsProcessed": {
    "recording": true,
    "notes": false,
    "document": true
  }
}
```

**Side effects:** Updates `recordingLink`, `notes`, `documentLink`, `rawTranscript`, `processedSummary`, `status`, `title` in Firestore.

---

### Try / Demo Endpoints (No Auth)

These endpoints are used by the public landing page. They require no authentication, do not interact with Firestore or GCS, and process everything in-memory.

#### `POST /appointments/generate-questions-try`
Generates questions from provided text.

**Input:** `multipart/form-data` or `application/json`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` or `transcript` | string | ✅ | Text to generate questions from |

**Response (200):**
```json
{
  "questions": ["..."],
  "message": "Questions generated successfully"
}
```

---

#### `POST /appointments/upload-recording-try`
Uploads a recording, splits into chunks, transcribes, and generates SOAP notes — all in-memory.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recording` | file | ✅ | Audio recording file |

**Response (200):**
```json
{
  "message": "Recording uploaded and processed successfully",
  "soapNotes": { ... },
  "title": "...",
  "transcript": "full transcript text...",
  "status": "Completed",
  "chunksProcessed": 3
}
```

---

#### `POST /appointments/upload-notes-try`
Processes pasted notes into SOAP format.

**Input:** `multipart/form-data`
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | ✅ | Appointment notes text |

**Response (200):**
```json
{
  "message": "Recording uploaded and processed successfully",
  "soapNotes": { ... },
  "title": "...",
  "status": "Completed"
}
```

---

## Shared Services & Helpers

The `routes/services.py` module provides shared infrastructure to avoid code duplication across route files:

### Service Initialization
- **`get_services()`** — Lazy-initializes `SpeechToTextService`, `StorageService`, and `VertexAIService`. Called by every endpoint that needs GCP services.

### Firestore Helpers
- **`get_appointment_or_404()`** — Validates appointment exists and belongs to user. Returns `(ref, data, None)` or `(None, None, error_response)`.
- **`set_appointment_error()`** — Sets status to `"Error"` (used in exception handlers).
- **`update_title_if_empty()`** — Conditionally sets title from SOAP notes.

### Processing Helpers
- **`generate_soap_and_finalize()`** — Generates SOAP from transcript, updates appointment to `"Completed"`, and sets the title. Used by `upload-recording`, `finalize`, and related endpoints.
- **`split_audio_to_webm_chunks()`** — Uses pydub to split audio into 30-second webm chunks.
- **`transcribe_chunks()`** — Transcribes a list of audio chunks without GCS/Firestore side effects (used by demo endpoints).
- **`parse_notes_from_request()`** — Extracts notes from form data or JSON body.

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Description of what went wrong",
  "status": "failed"
}
```

Common HTTP status codes:
| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created (new appointment) |
| `400` | Bad request (missing required input) |
| `404` | Appointment not found |
| `500` | Internal server error |

When an error occurs during processing, the appointment's `status` field in Firestore is automatically set to `"Error"` via the `set_appointment_error()` helper.
