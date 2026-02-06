# Medical Scribe Backend

The Medical Scribe backend has been split into two microservices for better scalability and separation of concerns:

## Services

### 1. backend-crud
Handles all CRUD (Create, Read, Update, Delete) operations for appointments.

**Endpoints:**
- `POST /appointments` - Create a new appointment
- `GET /appointments` - Get all appointments for a user
- `GET /appointments/{id}` - Get appointment details
- `DELETE /appointments/{id}` - Delete appointment

**Dependencies:**
- Flask
- Firebase Admin SDK
- Google Cloud Firestore

[View backend-crud README](./backend-crud/README.md)

### 2. backend-processing
Handles all audio processing, transcription, and AI-powered features.

**Endpoints:**
- `POST /appointments/{id}/audio-chunks` - Upload and transcribe audio chunks
- `POST /appointments/{id}/generate-questions` - Generate patient questions
- `POST /appointments/{id}/finalize` - Finalize appointment with SOAP notes
- `POST /appointments/{id}/upload-recording` - Upload and process full recording
- `GET /appointments/search?q={query}` - Search appointments

**Dependencies:**
- Flask
- Firebase Admin SDK
- Google Cloud Speech-to-Text
- Google Cloud Storage
- Vertex AI (Gemini)
- FFmpeg

[View backend-processing README](./backend-processing/README.md)

## Architecture

```
┌─────────────────┐
│   Frontend      │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  backend-crud   │  │ backend-processing│  │   Firestore      │
│                 │  │                   │  │                  │
│ - Create        │  │ - Transcription   │  │ - Appointments   │
│ - Read          │  │ - AI Questions    │  │ - User Data      │
│ - Update        │  │ - SOAP Notes      │  │                  │
│ - Delete        │  │ - Search          │  │                  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Cloud Storage   │
                     │                  │
                     │ - Audio Files    │
                     │ - Recordings     │
                     └──────────────────┘
```

## Deployment

Both services are designed to be deployed to Google Cloud Run as separate services.

### Deploy backend-crud
```bash
cd backend-crud
gcloud run deploy backend-crud \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Deploy backend-processing
```bash
cd backend-processing
gcloud run deploy backend-processing \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300
```

## Environment Variables

Both services require environment variables. Copy `.env.example` to `.env` in each service directory and fill in the values.

### backend-crud
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `GCP_PROJECT_ID`
- `FIRESTORE_DATABASE_ID`

### backend-processing
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `GCP_PROJECT_ID`
- `GCP_BUCKET_NAME`
- `GCP_LOCATION`
- `FIRESTORE_DATABASE_ID`
- `VERTEX_AI_MODEL`

## Authentication

All endpoints require Firebase Authentication. The frontend must include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Original Backend

The original monolithic backend is still available in the `backend` directory root for reference. It contains all the functionality that has now been split into the two microservices.

## Migration Notes

When migrating from the monolithic backend to the microservices:

1. Update frontend API endpoints to point to the correct service
2. CRUD operations → `backend-crud` service URL
3. Processing operations → `backend-processing` service URL
4. Ensure both services have access to the same Firestore database
5. Configure CORS settings for both services
6. Update any CI/CD pipelines to deploy both services

## Local Development

To run both services locally:

```bash
# Terminal 1 - CRUD Service
cd backend-crud
pip install -r requirements.txt
python app.py

# Terminal 2 - Processing Service
cd backend-processing
pip install -r requirements.txt
python app.py
```

By default, both will try to run on port 8080. You'll need to change the port for one of them:

```bash
# Run CRUD on 8080
cd backend-crud
python app.py

# Run Processing on 8081
cd backend-processing
PORT=8081 python app.py
```
