# Medical Scribe Backend API

A Flask-based REST API for medical appointment transcription and management using Google Cloud services (Firestore, Speech-to-Text, Cloud Storage, Vertex AI).

## Features

- **Firebase Authentication**: Secure endpoints with Firebase ID token verification
- **Real-time Transcription**: Convert audio chunks to text using Google Speech-to-Text API
- **AI-Powered Questions**: Generate patient questions using Vertex AI (Gemini)
- **SOAP Notes**: Automatically process transcripts into structured SOAP format
- **Cloud Storage**: Store full audio recordings in Google Cloud Storage
- **Search**: Full-text search across appointment summaries

## Prerequisites

- Python 3.8+
- Google Cloud Platform account
- Firebase project with Authentication enabled
- Google Cloud services enabled:
  - Firestore
  - Cloud Speech-to-Text API
  - Cloud Storage
  - Vertex AI API

## Setup Instructions

### 1. Clone the Repository

```bash
cd backend
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Google Cloud

#### Download Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in the backend directory

#### Set Up Google Cloud

1. Install Google Cloud SDK (gcloud CLI)
2. Authenticate:
   ```bash
   gcloud auth application-default login
   ```
3. Set your project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

#### Enable Required APIs

```bash
gcloud services enable firestore.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

#### Create Cloud Storage Bucket

```bash
gcloud storage buckets create gs://YOUR_BUCKET_NAME --location=us-central1
```

### 5. Configure Environment Variables

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=serviceAccountKey.json
GCP_PROJECT_ID=your-project-id
GCP_BUCKET_NAME=your-bucket-name
GCP_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-1.5-pro
```

### 6. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### 1. Create Appointment

**POST** `/appointments`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "appointmentId": "uuid",
  "status": "In Progress",
  "message": "Appointment created successfully"
}
```

### 2. Upload Audio Chunk

**POST** `/appointments/{appointmentId}/audio-chunks`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Body:**
- `audioChunk`: Audio file (WAV format recommended)

**Response:**
```json
{
  "status": "uploaded",
  "message": "Audio chunk processed and transcript updated",
  "transcriptLength": 1234
}
```

### 3. Generate Questions

**POST** `/appointments/{appointmentId}/generate-questions`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "questions": [
    "What are the side effects of this medication?",
    "How long should I expect recovery to take?",
    "When should I schedule a follow-up?"
  ],
  "message": "Questions generated successfully"
}
```

### 4. Finalize Appointment

**POST** `/appointments/{appointmentId}/finalize`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
Content-Type: multipart/form-data
```

**Body:**
- `fullAudio`: Complete audio file (WAV format)

**Response:**
```json
{
  "message": "Appointment finalized successfully",
  "appointmentId": "uuid",
  "recordingLink": "https://storage.googleapis.com/...",
  "soapNotes": {
    "Subjective": "...",
    "Objective": "...",
    "Assessment": "...",
    "Plan": "...",
    "OtherNotes": "..."
  },
  "status": "Completed"
}
```

### 5. Get Appointment

**GET** `/appointments/{appointmentId}`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "appointmentId": "uuid",
  "userId": "firebase_user_id",
  "RawTranscript": "...",
  "ProcessedSummary": {...},
  "RecordingLink": "...",
  "Status": "Completed",
  "CreatedDate": "2024-01-27T10:00:00",
  "LastUpdated": "2024-01-27T10:30:00"
}
```

### 6. Search Appointments

**GET** `/appointments/search?q={searchQuery}`

**Headers:**
```
Authorization: Bearer <firebase_id_token>
```

**Response:**
```json
{
  "query": "diabetes",
  "results": [
    {
      "appointmentId": "uuid",
      "createdDate": "2024-01-27T10:00:00",
      "status": "Completed"
    }
  ],
  "count": 1
}
```

## Project Structure

```
backend/
├── app.py                          # Main Flask application
├── config.py                       # Configuration and Firebase initialization
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── routes/
│   ├── __init__.py
│   └── appointments.py             # Appointment endpoints
└── utils/
    ├── __init__.py
    ├── auth.py                     # Firebase authentication decorator
    ├── speech_to_text.py           # Google Speech-to-Text service
    ├── storage.py                  # Google Cloud Storage service
    └── vertex_ai.py                # Vertex AI (Gemini) service
```

## Firestore Data Structure

### Appointments Collection

```
appointments/
└── {appointmentId}
    ├── appointmentId: string
    ├── userId: string
    ├── RawTranscript: string
    ├── ProcessedSummary: {
    │   ├── Subjective: string
    │   ├── Objective: string
    │   ├── Assessment: string
    │   ├── Plan: string
    │   └── OtherNotes: string
    │   }
    ├── RecordingLink: string
    ├── Status: string ("In Progress" | "Completed")
    ├── CreatedDate: string (ISO 8601)
    ├── LastUpdated: string (ISO 8601)
    └── CompletedDate: string (ISO 8601)
```

## Audio Requirements

- **Format**: WAV (recommended)
- **Encoding**: LINEAR16
- **Sample Rate**: 16000 Hz
- **Channels**: Mono (single channel)

For audio chunks, ensure they're properly formatted for Google Speech-to-Text API.

## Development

### Running in Development Mode

```bash
export FLASK_ENV=development  # Windows: set FLASK_ENV=development
python app.py
```

### Testing Endpoints

You can use tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)

Example cURL request:

```bash
curl -X POST http://localhost:5000/appointments \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json"
```

## Security Considerations

- Never commit `.env` file or `serviceAccountKey.json`
- Always use HTTPS in production
- Firebase tokens expire after 1 hour
- Implement rate limiting for production
- Set up proper CORS configuration for your frontend domain
- Use signed URLs for Cloud Storage access instead of public URLs

## Deployment

### Google Cloud Run (Recommended)

1. Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
```

2. Deploy:
```bash
gcloud run deploy medical-scribe-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Ensure Firebase service account key is properly configured
2. **Speech-to-Text Fails**: Check audio format (LINEAR16, 16000 Hz)
3. **Firestore Permission Denied**: Verify Firestore rules allow authenticated access
4. **Vertex AI Error**: Ensure API is enabled and model name is correct

### Logs

Check application logs:
```bash
# Local
tail -f logs/app.log

# Cloud Run
gcloud run logs read medical-scribe-api --region us-central1
```

## License

[Your License Here]

## Support

For issues and questions, please contact [your contact information].
