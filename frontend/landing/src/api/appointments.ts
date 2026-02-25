import { checkProcessingServiceHealth } from './firebase';
import { analyticsEvents } from './analytics';

const API_URL_PROCESSING = import.meta.env.VITE_API_PROCESSING_URL;

// =============================================================================
// Types
// =============================================================================

export interface SoapNotes {
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
// Try Appointments API (no auth required)
// =============================================================================

export async function tryUploadNotesAppointment(
  uploadNotes: string,
): Promise<{ soapNotes: SoapNotes; title: string }> {
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

  const formData = new FormData();
  formData.append('notes', uploadNotes);

  analyticsEvents.finalizeAppointment();

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

export async function tryUploadRecording(
  file: File,
): Promise<{ soapNotes: SoapNotes; title: string; transcript: string }> {
  if (!file) {
    throw new Error('Invalid recording file');
  }

  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

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

export async function tryGenerateQuestions(
  notes?: string,
): Promise<{ questions: string[] }> {
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

  const body = notes ? (() => { const fd = new FormData(); fd.append('notes', notes); return fd; })() : undefined;

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/generate-questions-try`,
    { method: 'POST', body },
  );

  if (!response.ok) {
    let errorMessage = 'Failed to generate questions';
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
