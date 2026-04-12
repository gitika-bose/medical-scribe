# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Medical Scribe is a healthcare app for automated appointment transcription and AI-powered analysis. It is a monorepo with:
- **Backend**: Python Flask service for audio processing, transcription, and AI
- **Frontend**: React Native (Expo) mobile/web app + React web landing page
- **Cloud**: Google Cloud (Cloud Run, Firestore, Speech-to-Text, Vertex AI), Firebase Hosting

## Commands

### Backend (`backend/backend-processing/`)
```bash
pip install -r requirements.txt
python app.py                    # Run locally (port 8080)
```

### Frontend Expo App (`frontend/frontend-expo/`)
```bash
npm ci
npm start                        # Start dev server
npm run web                      # Web build
npx expo export --platform web  # Production web export (output: dist/)
```

### Frontend Landing Page (`frontend/landing/`)
```bash
npm ci
npm run dev                      # Start Vite dev server
npm run build                    # TypeScript + Vite build (output: dist/)
npm run lint                     # ESLint check
```

## Deployment

Deployments are triggered by pushing to specific branches:
- `deploy-backend` → Google Cloud Run (`patient-scribe-app`, `us-central1`, 2Gi memory)
- `deploy-app` → Firebase Hosting target `app` (Expo web export)
- `deploy-landing` → Firebase Hosting target `landing`

Firebase Hosting config is at `frontend/firebase.json` (two targets: `app` and `landing`, both SPA rewrites).

## Architecture

### Backend (`backend/backend-processing/`)
Flask app with blueprints in `routes/`, utilities in `utils/`. Key utilities:
- `utils/speech_to_text.py` — Google Speech-to-Text with speaker diarization
- `utils/vertex_ai.py` — Gemini LLM for question generation and SOAP notes
- `utils/storage.py` — Cloud Storage file operations
- `utils/auth.py` — Firebase token verification (all endpoints require Firebase ID token in `Authorization` header)
- `utils/processing.py` — Audio format conversion via FFmpeg/pydub
- `config.py` — Firebase & GCP initialization
- `telemetry.py` — OpenTelemetry tracing (appointment ID used as session ID)

Key API endpoints:
- `POST /appointments/{id}/audio-chunks` — Process audio chunk
- `POST /appointments/{id}/generate-questions` — AI question generation
- `POST /appointments/{id}/upload-recording` — Upload & process full recording
- `POST /appointments/{id}/finalize` — Finalize with SOAP notes
- `GET /appointments/search?q={query}` — Search by summary

### Frontend Expo App (`frontend/frontend-expo/`)
- **Routing**: Expo Router (file-based, `app/` directory)
- **State**: Zustand (`store/index.ts`)
- **Auth**: Firebase Auth via `hooks/useAuth.tsx`
- **Audio**: Custom hook `hooks/useAudioRecorder.ts`
- **Styling**: NativeWind (Tailwind for React Native)
- **API clients**: `api/appointments.ts`, `api/user.ts`, `api/analytics.ts`
- **Path aliases**: `@/*` maps to root (configured in `tsconfig.json`)
- **Firebase packages**: Resolved via `metro.config.js` for React Native compatibility

### Frontend Landing (`frontend/landing/`)
- React + Vite SPA, React Router DOM for client-side routing
- Firebase Web SDK in `src/api/firebase.ts`

## Environment Variables

Backend requires:
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `GCP_PROJECT_ID`, `GCP_BUCKET_NAME`, `GCP_LOCATION`
- `FIRESTORE_DATABASE_ID` (default: `(default)`)
- `VERTEX_AI_MODEL` (default: `gemini-1.5-pro`)

Frontend apps use `.env.local` / `.env.production` for Firebase config injected at build time.
