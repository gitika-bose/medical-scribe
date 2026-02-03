# Medical Scribe API Specification

## Overview
This document provides a detailed specification of all API endpoints for the Medical Scribe backend.

## Base URL
```
http://localhost:8080
```

## Authentication
All endpoints (except `/health` and `/`) require Firebase Authentication.

**Header Format:**
```
Authorization: Bearer <firebase_id_token>
```

---

## Endpoints

### 1. Create Appointment

Creates a new appointment session and initializes a Firestore document.

**Endpoint:** `POST /appointments`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:** None

**Response (201 Created):**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "In Progress",
  "message": "Appointment created successfully"
}
```

**Firestore Document Created:**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "firebase_user_id",
  "RawTranscript": "",
  "CreatedDate": "2024-01-27T10:00:00.000Z",
  "LastUpdated": "2024-01-27T10:00:00.000Z",
  "Status": "In Progress",
  "RecordingLink": ""
}
```

---

### 2. Upload Audio Chunk

Processes an audio chunk, transcribes it using Google Speech-to-Text, and appends to the RawTranscript field.

**Endpoint:** `POST /appointments/{appointmentId}/audio-chunks`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
audioChunk: <file> (WAV format, LINEAR16, 16kHz)
```

**Response (200 OK):**
```json
{
  "status": "uploaded",
  "message": "Audio chunk processed and transcript updated",
  "transcriptLength": 1234
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "No audio chunk provided",
  "status": "failed"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Appointment not found",
  "status": "failed"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Unauthorized",
  "status": "failed"
}
```

---

### 3. Generate Questions

Generates 2-3 potential patient questions based on the current transcript using Vertex AI.

**Endpoint:** `POST /appointments/{appointmentId}/generate-questions`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: application/json
```

**Request Body:** None

**Response (200 OK):**
```json
{
  "questions": [
    "What are the potential side effects of this medication?",
    "How long should I take this treatment?",
    "When should I schedule my follow-up appointment?"
  ],
  "message": "Questions generated successfully"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "No transcript available yet"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Appointment not found"
}
```

---

### 4. Finalize Appointment

Uploads full audio recording to Cloud Storage and processes the transcript into SOAP format.

**Endpoint:** `POST /appointments/{appointmentId}/finalize`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
fullAudio: <file> (WAV format)
```

**Response (200 OK):**
```json
{
  "message": "Appointment finalized successfully",
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "recordingLink": "https://storage.googleapis.com/bucket-name/recordings/...",
  "soapNotes": {
    "Subjective": "Patient reports persistent headache for 3 days...",
    "Objective": "Blood pressure 120/80, temperature 98.6°F...",
    "Assessment": "Tension-type headache, likely stress-related...",
    "Plan": "Prescribed ibuprofen 400mg, follow-up in 1 week...",
    "OtherNotes": "Patient requests work excuse note..."
  },
  "status": "Completed"
}
```

**Processing Steps:**
1. Upload full audio file to Google Cloud Storage
2. Update RecordingLink field in Firestore
3. Process RawTranscript using Vertex AI to generate SOAP notes
4. Update appointment status to "Completed"
5. Add ProcessedSummary and CompletedDate fields

---

### 5. Get Appointment

Retrieves complete appointment data for a specific appointment ID.

**Endpoint:** `GET /appointments/{appointmentId}`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response (200 OK):**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "firebase_user_id",
  "RawTranscript": "Doctor: Hello, how are you feeling today? Patient: I've been having headaches...",
  "ProcessedSummary": {
    "Subjective": "Patient reports persistent headache for 3 days...",
    "Objective": "Blood pressure 120/80, temperature 98.6°F...",
    "Assessment": "Tension-type headache, likely stress-related...",
    "Plan": "Prescribed ibuprofen 400mg, follow-up in 1 week...",
    "OtherNotes": ""
  },
  "RecordingLink": "https://storage.googleapis.com/bucket-name/recordings/...",
  "Status": "Completed",
  "CreatedDate": "2024-01-27T10:00:00.000Z",
  "LastUpdated": "2024-01-27T10:30:00.000Z",
  "CompletedDate": "2024-01-27T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Appointment not found"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Unauthorized"
}
```

---

### 6. Upload Recording

Uploads a pre-recorded audio file, splits it into 30-second chunks, processes each chunk through transcription, and finalizes the appointment.

**Endpoint:** `POST /appointments/{appointmentId}/upload-recording`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
recording: <file> (Audio file in any common format: webm, mp3, wav, m4a, etc.)
```

**Response (200 OK):**
```json
{
  "status": "completed",
  "message": "Recording uploaded and processed successfully",
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "recordingLink": "https://storage.googleapis.com/bucket-name/recordings/...",
  "soapNotes": {
    "Subjective": "Patient reports persistent headache for 3 days...",
    "Objective": "Blood pressure 120/80, temperature 98.6°F...",
    "Assessment": "Tension-type headache, likely stress-related...",
    "Plan": "Prescribed ibuprofen 400mg, follow-up in 1 week...",
    "OtherNotes": ""
  },
  "chunksProcessed": 5,
  "transcriptLength": 2345
}
```

**Processing Steps:**
1. Load and validate the audio file
2. Split audio into 30-second chunks using pydub
3. For each chunk:
   - Export to webm format
   - Upload to Cloud Storage
   - Transcribe using Google Speech-to-Text
   - Append transcript to appointment's RawTranscript
4. Upload full audio recording to Cloud Storage
5. Process complete transcript into SOAP notes using Vertex AI
6. Update appointment status to "Completed"

**Error Response (400 Bad Request):**
```json
{
  "error": "No recording file provided",
  "status": "failed"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Appointment not found",
  "status": "failed"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Unauthorized",
  "status": "failed"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Failed to process chunk 3: [error details]",
  "status": "failed"
}
```

---

### 7. Search Appointments

Searches for appointments by query string across all SOAP note fields.

**Endpoint:** `GET /appointments/search?q={searchQuery}`

**Authorization:** Required

**Request Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Query Parameters:**
- `q` (required): Search query string

**Example Request:**
```
GET /appointments/search?q=headache
```

**Response (200 OK):**
```json
{
  "query": "headache",
  "results": [
    {
      "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
      "createdDate": "2024-01-27T10:00:00.000Z",
      "status": "Completed"
    },
    {
      "appointmentId": "660e8400-e29b-41d4-a716-446655440001",
      "createdDate": "2024-01-25T14:30:00.000Z",
      "status": "Completed"
    }
  ],
  "count": 2
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Search query parameter \"q\" is required"
}
```

**Search Scope:**
The search is performed across the following fields in ProcessedSummary:
- Subjective
- Objective
- Assessment
- Plan
- OtherNotes

Search is case-insensitive and matches partial strings.

---

## Additional Endpoints

### Health Check

**Endpoint:** `GET /health`

**Authorization:** Not Required

**Response (200 OK):**
```json
{
  "status": "healthy",
  "message": "Medical Scribe API is running"
}
```

---

### Root / Info

**Endpoint:** `GET /`

**Authorization:** Not Required

**Response (200 OK):**
```json
{
  "name": "Medical Scribe API",
  "version": "1.0.0",
  "endpoints": {
    "POST /appointments": "Create a new appointment",
    "POST /appointments/{id}/audio-chunks": "Upload audio chunk for transcription",
    "POST /appointments/{id}/generate-questions": "Generate patient questions",
    "POST /appointments/{id}/upload-recording": "Upload pre-recorded audio file",
    "POST /appointments/{id}/finalize": "Finalize appointment with full audio",
    "GET /appointments/{id}": "Get appointment details",
    "GET /appointments/search?q=<query>": "Search appointments"
  }
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing parameters or invalid data) |
| 401 | Unauthorized (invalid or missing Firebase token) |
| 403 | Forbidden (user doesn't own the resource) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Data Models

### Appointment Document (Firestore)

```typescript
interface Appointment {
  appointmentId: string;           // UUID
  userId: string;                  // Firebase user ID
  RawTranscript: string;           // Accumulated transcript from audio chunks
  ProcessedSummary?: {             // Generated after finalization
    Subjective: string;
    Objective: string;
    Assessment: string;
    Plan: string;
    OtherNotes: string;
  };
  RecordingLink: string;           // Cloud Storage URL (set after finalization)
  Status: "In Progress" | "Completed";
  CreatedDate: string;             // ISO 8601 format
  LastUpdated: string;             // ISO 8601 format
  CompletedDate?: string;          // ISO 8601 format (set after finalization)
}
```

---

## Audio Specifications

### Audio Chunk Requirements
- **Format:** WAV
- **Encoding:** LINEAR16
- **Sample Rate:** 16000 Hz
- **Channels:** Mono (1 channel)
- **Field Name:** `audioChunk`

### Full Audio Requirements
- **Format:** WAV
- **Encoding:** Any
- **Field Name:** `fullAudio`

---

## Google Cloud Services Used

1. **Firebase Authentication** - User authentication and token verification
2. **Firestore** - NoSQL database for appointment storage
3. **Cloud Speech-to-Text** - Audio transcription with medical conversation model
4. **Cloud Storage** - Audio recording storage
5. **Vertex AI (Gemini)** - Question generation and SOAP note processing

---

## Rate Limiting

Currently not implemented. Recommended for production:
- 100 requests per minute per user
- 1000 requests per hour per user
- Use Firebase App Check for additional security

---

## CORS Configuration

Currently allows all origins for development. Configure for production to allow only your frontend domain.

---

## Security Best Practices

1. Always use HTTPS in production
2. Firebase tokens expire after 1 hour - implement token refresh in client
3. Validate file types and sizes on both client and server
4. Implement rate limiting
5. Use signed URLs for Cloud Storage access
6. Set up proper Firestore security rules
7. Enable Cloud Armor for DDoS protection
8. Monitor API usage and set up alerts
