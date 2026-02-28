import { checkProcessingServiceHealth, getAuthToken } from './firebase';
import { analyticsEvents } from './analytics';

const API_URL_PROCESSING = import.meta.env.VITE_API_PROCESSING_URL;

// =============================================================================
// Types — Schema v1.2 (legacy, used by TryPage)
// =============================================================================

export interface SoapNotesV12 {
  summary?: string;
  reason_for_visit?: string;
  diagnosis?: {
    details: Array<{
      title: string;
      description: string;
      severity?: 'high' | 'medium' | 'low';
    }>;
  };
  todos?: Array<{
    type: string;
    title: string;
    description: string;
    recommended: boolean;
    verified: boolean;
    dosage?: string;
    frequency?: string;
    timing?: string;
    duration?: string;
    timeframe?: string;
  }>;
  follow_up?: Array<{
    description: string;
    time_frame: string;
  }>;
  learnings?: Array<{
    title: string;
    description: string;
  }>;
}

// =============================================================================
// Types — Schema v1.3 (used by TryPageNew)
// =============================================================================

export interface SoapNotesV13 {
  version?: string;
  title?: string;
  doctor_name?: string;
  location?: string;
  date?: string;
  summary?: string;
  reason_for_visit?: Array<{
    reason: string;
    description: string;
  }>;
  diagnosis?: {
    details: Array<{
      title: string;
      description: string;
      severity?: 'high' | 'medium' | 'low';
    }>;
  };
  tests?: Array<{
    title: string;
    description: string;
    importance: 'high' | 'low';
    source?: string;
  }>;
  medications?: Array<{
    title: string;
    dosage?: string;
    frequency?: string;
    timing?: string;
    duration?: string;
    instructions?: string;
    importance: 'high' | 'low';
    source?: string;
    change?: boolean;
  }>;
  procedures?: Array<{
    title: string;
    description: string;
    timeframe?: string;
    importance: 'high' | 'low';
    source?: string;
  }>;
  other?: Array<{
    title: string;
    description: string;
    dosage?: string;
    frequency?: string;
    timing?: string;
    duration?: string;
    importance: 'high' | 'low';
    source?: string;
  }>;
  follow_up?: Array<{
    description: string;
    time_frame: string;
  }>;
  why_recommended?: string;
  risks_side_effects?: Array<{
    title: string;
    description: string;
    source?: string;
    importance: 'high' | 'low';
  }>;
  action_todo?: Array<{
    title: string;
    importance: 'high' | 'low';
    source?: string;
  }>;
}

// =============================================================================
// Internal helpers
// =============================================================================

async function ensureHealthy(): Promise<void> {
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return { Authorization: `Bearer ${token}` };
}

async function authJsonHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// =============================================================================
// Try Page API — uses authenticated endpoints with guest user
// =============================================================================

/**
 * Step 1: Create a new appointment.
 * Calls POST /appointments (authenticated).
 */
export async function tryCreateAppointment(): Promise<string> {
  await ensureHealthy();

  const headers = await authJsonHeaders();
  const response = await fetch(`${API_URL_PROCESSING}/appointments`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to create appointment');
  }

  const data = await response.json();
  return data.appointmentId;
}

/**
 * Step 2: Upload a recording file.
 * Calls POST /appointments/{id}/upload-recording-new (authenticated).
 * Just uploads to GCS — no transcription or processing.
 */
export async function tryUploadRecording(
  appointmentId: string,
  file: File,
): Promise<{ recordingGcsUri: string }> {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append('recording', file, file.name);

  analyticsEvents.uploadRecording(file.size);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/upload-recording-new`,
    {
      method: 'POST',
      headers,
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to upload recording';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Step 3: Upload a document (PDF) file.
 * Calls POST /appointments/{id}/upload-document (authenticated).
 * Can be called multiple times for multiple files (max 5).
 */
export async function tryUploadDocument(
  appointmentId: string,
  file: File,
): Promise<{ documentGcsUri: string }> {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append('document', file, file.name);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/upload-document`,
    {
      method: 'POST',
      headers,
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to upload document';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Step 4: Upload notes text.
 * Calls POST /appointments/{id}/upload-notes (authenticated).
 */
export async function tryUploadNotes(
  appointmentId: string,
  notes: string,
): Promise<void> {
  const headers = await authHeaders();
  const formData = new FormData();
  formData.append('notes', notes);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/upload-notes`,
    {
      method: 'POST',
      headers,
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to upload notes';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }
}

/**
 * Step 5: Process the appointment — transcribes recording, extracts PDF text,
 * combines with notes, and generates SOAP summary.
 * Calls POST /appointments/{id}/process (authenticated).
 */
export async function tryProcessAppointment(
  appointmentId: string,
): Promise<{ soapNotes: SoapNotesV13; title?: string }> {
  const headers = await authJsonHeaders();

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/process`,
    {
      method: 'POST',
      headers,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to process appointment';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Step 6: Generate questions based on the appointment transcript/notes.
 * Calls POST /appointments/{id}/generate-questions (authenticated).
 */
export async function tryGenerateQuestions(
  appointmentId: string,
): Promise<{ questions: string[] }> {
  const headers = await authJsonHeaders();

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/generate-questions`,
    {
      method: 'POST',
      headers,
    },
  );

  if (!response.ok) {
    // Non-fatal — questions are optional
    return { questions: [] };
  }

  return response.json();
}

// =============================================================================
// Legacy Try Page API — unauthenticated endpoints (schema v1.2, used by TryPage)
// =============================================================================

/**
 * Upload a recording and get SOAP notes back (v1.2 schema).
 * Calls POST /appointments/upload-recording-try (no auth).
 */
export async function tryUploadRecordingLegacy(
  file: File,
): Promise<{ soapNotes: SoapNotesV12; title: string; transcript: string }> {
  await ensureHealthy();

  const formData = new FormData();
  formData.append('recording', file, file.name);

  analyticsEvents.uploadRecording(file.size);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/upload-recording-try`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to upload recording';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Upload notes text and get SOAP notes back (v1.2 schema).
 * Calls POST /appointments/upload-notes-try (no auth).
 */
export async function tryUploadNotesAppointmentLegacy(
  notes: string,
): Promise<{ soapNotes: SoapNotesV12; title: string }> {
  await ensureHealthy();

  const formData = new FormData();
  formData.append('notes', notes);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/upload-notes-try`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to process notes';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) errorMessage = errorBody.error;
    } catch {
      // fall back to default message
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Generate questions from transcript text (v1.2 flow).
 * Calls POST /appointments/generate-questions-try (no auth).
 */
export async function tryGenerateQuestionsLegacy(
  transcript: string,
): Promise<{ questions: string[] }> {
  const formData = new FormData();
  formData.append('notes', transcript);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/generate-questions-try`,
    {
      method: 'POST',
      body: formData,
    },
  );

  if (!response.ok) {
    return { questions: [] };
  }

  return response.json();
}
