# Medical Scribe Backend - CRUD Service

This service handles all CRUD (Create, Read, Update, Delete) operations for appointments in the Medical Scribe application.

## Endpoints

### POST /appointments
Creates a new appointment object in Firestore at the start of a user session.

**Response:**
```json
{
  "appointmentId": "uuid",
  "status": "In Progress",
  "message": "Appointment created successfully"
}
```

### GET /appointments
Returns all appointments for the authenticated user.

**Response:**
```json
{
  "appointments": [...],
  "count": 10
}
```

### GET /appointments/{id}
Fetches appointment data for the specified appointment ID.

**Response:**
```json
{
  "appointmentId": "uuid",
  "userId": "user-id",
  "RawTranscript": "...",
  "CreatedDate": "2024-01-01T00:00:00",
  "LastUpdated": "2024-01-01T00:00:00",
  "Status": "In Progress",
  "RecordingLink": ""
}
```

### DELETE /appointments/{id}
Deletes the specified appointment from Firestore.

**Response:**
```json
{
  "message": "Appointment deleted successfully",
  "appointmentId": "uuid"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```
FIREBASE_SERVICE_ACCOUNT_PATH=path/to/serviceAccountKey.json
GCP_PROJECT_ID=your-project-id
FIRESTORE_DATABASE_ID=appointments-db
```

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

## Docker Deployment

```bash
# Build the image
docker build -t backend-crud .

# Run the container
docker run -p 8080:8080 --env-file .env backend-crud
```

## Cloud Run Deployment

```bash
# Build and deploy to Cloud Run
gcloud run deploy backend-crud \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```
