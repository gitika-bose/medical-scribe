# Medical Scribe Backend - Processing Service

This service handles all audio processing, transcription, AI-powered question generation, and SOAP note generation for the Medical Scribe application.

## Endpoints

### POST /appointments/{id}/audio-chunks
Processes audio chunk, transcribes it using Google Speech-to-Text, and appends to RawTranscript.

**Request:**
- Form data with `audioChunk` file (audio/webm)

**Response:**
```json
{
  "status": "uploaded",
  "message": "Audio chunk processed and transcript updated",
  "transcriptLength": 1234
}
```

### POST /appointments/{id}/generate-questions
Generates 2-3 potential questions based on transcript so far using Vertex AI.

**Response:**
```json
{
  "questions": ["Question 1?", "Question 2?", "Question 3?"],
  "message": "Questions generated successfully"
}
```

### POST /appointments/{id}/upload-recording
Uploads a pre-recorded audio file, splits it into 30s chunks, processes each chunk through transcription, and finalizes the appointment with SOAP notes.

**Request:**
- Form data with `recording` file (audio file in any format)

**Response:**
```json
{
  "message": "Recording uploaded and processed successfully",
  "appointmentId": "uuid",
  "recordingLink": "gs://bucket/path",
  "soapNotes": {...},
  "status": "Completed",
  "chunksProcessed": 10
}
```

### POST /appointments/{id}/finalize
Finalizes appointment by uploading full audio to Cloud Storage and processing transcript into SOAP format.

**Request:**
- Form data with `fullAudio` file (optional if RecordingLink already exists)

**Response:**
```json
{
  "message": "Appointment finalized successfully",
  "appointmentId": "uuid",
  "recordingLink": "gs://bucket/path",
  "soapNotes": {...},
  "status": "Completed"
}
```

### GET /appointments/search?q={query}
Searches for appointments by query in processed summary texts.

**Response:**
```json
{
  "query": "diabetes",
  "results": [
    {
      "appointmentId": "uuid",
      "createdDate": "2024-01-01T00:00:00",
      "status": "Completed"
    }
  ],
  "count": 1
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
GCP_LOCATION=us-central1
FIRESTORE_DATABASE_ID=appointments-db
VERTEX_AI_MODEL=gemini-1.5-pro
```

## Dependencies

This service requires:
- Google Cloud Speech-to-Text API
- Google Cloud Storage
- Vertex AI (Gemini)
- FFmpeg (for audio processing)

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Ensure FFmpeg is installed
# On Ubuntu/Debian: apt-get install ffmpeg
# On macOS: brew install ffmpeg
# On Windows: Download from https://ffmpeg.org/

# Run the service
python app.py
```

## Docker Deployment

```bash
# Build the image
docker build -t backend-processing .

# Run the container
docker run -p 8080:8080 --env-file .env backend-processing
```

## Cloud Run Deployment

```bash
# Build and deploy to Cloud Run
gcloud run deploy backend-processing \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300
```

**Note:** This service requires more memory and longer timeout due to audio processing and AI operations.

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Audio Processing

- Audio chunks are transcribed in real-time using Google Speech-to-Text with speaker diarization
- Full recordings are split into 30-second chunks for processing
- Supports various audio formats (webm, mp3, wav, etc.)
- Uses FFmpeg for audio format conversion

## AI Features

- **Question Generation:** Uses Vertex AI (Gemini) to generate relevant patient questions based on conversation transcript
- **SOAP Notes:** Processes raw transcript into structured SOAP format (Subjective, Objective, Assessment, Plan)
