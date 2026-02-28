import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { Platform } from 'react-native';

import { auth, db, checkProcessingServiceHealth } from './firebase';
import { analyticsEvents } from './analytics';

const API_URL_PROCESSING = process.env.EXPO_PUBLIC_API_PROCESSING_URL;

// =============================================================================
// Types
// =============================================================================

export interface Appointment {
  status: 'InProgress' | 'Completed' | 'Error';
  appointmentDate: string;
  title?: string;
  doctor?: string;
  location?: string;
  processedSummary?: any;
  rawTranscript?: string;
  recordingLink?: string;
  error?: string;
}

export interface AppointmentWithId extends Appointment {
  appointmentId: string;
}

// =============================================================================
// Try Appointments API
// =============================================================================

/**
 * Helper: append an audio file to FormData from a URI string or Blob.
 * On web, blob: URLs are fetched to obtain an actual Blob.
 * On native (React Native), the { uri, type, name } convention is used.
 */
async function appendAudioToFormData(
  formData: FormData,
  fieldName: string,
  audio: string | Blob,
  fileName: string,
  mimeType: string,
): Promise<void> {
  if (audio instanceof Blob) {
    formData.append(fieldName, audio, fileName);
  } else if (Platform.OS === 'web' && audio.startsWith('blob:')) {
    // Web: blob URL → fetch actual Blob
    const resp = await fetch(audio);
    const blob = await resp.blob();
    formData.append(fieldName, blob, fileName);
  } else {
    // React Native file URI
    formData.append(fieldName, {
      uri: audio,
      type: mimeType,
      name: fileName,
    } as any);
  }
}

export async function tryGenerateQuestions(
  appointmentId: string,
): Promise<{ questions: string[] }> {
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/generate-questions-try`,
    { method: 'POST' },
  );

  if (!response.ok) {
    // Try to extract the actual error message from the backend response
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        errorMessage = errorBody.error;
      }
    } catch (_) {
      // Ignore JSON parse errors; fall back to statusText
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function tryUploadNotesAppointment(
  uploadNotes: string,
): Promise<{ soapNotes: any }> {
  try {
    const isHealthy = await checkProcessingServiceHealth();
    if (!isHealthy) {
      throw new Error('Service is currently unavailable. Please try again later.');
    }

    const formData = new FormData();

    formData.append('notes',uploadNotes)
    analyticsEvents.finalizeAppointment();

    const response = await fetch(
      `${API_URL_PROCESSING}/appointments/upload-notes-try`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to finalize appointment`);
    }

    return response.json();
  } catch (err) {
    console.error('❌ Failed to finalize appointment:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to finalize recording';
    throw new Error(errorMsg);
  }
}

/** Upload a pre-recorded audio file for processing. */
export async function tryUploadRecording(
  file: { uri: string; name: string; mimeType?: string; size?: number },
): Promise<{ status: string; soapNotes: any; recordingLink: string }> {

  if (!file || !file.uri) {
    const error = new Error('Invalid recording file');
    console.error('❌ Failed to upload recording:', error);
    throw error;
  }

  try {
    // Check service health before uploading recording
    const isHealthy = await checkProcessingServiceHealth();
    if (!isHealthy) {
      const error = new Error('Service is currently unavailable. Please try again later.');
      console.error('❌ Failed to upload recording:', error);
      throw error;
    }

    const formData = new FormData();

    // Check if running on web (blob: URL) or native (file:// URI)
    const isWebBlob = file.uri.startsWith('blob:');
    
    if (isWebBlob) {
      // Web platform: fetch the blob and append as File
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('recording', blob, file.name);
    } else {
      // React Native: use { uri, name, type } format
      const mimeType = file.mimeType || 'audio/m4a';
      formData.append('recording', {
        uri: file.uri,
        name: file.name,
        type: mimeType,
      } as any);
    }

    // Log analytics event for uploading recording
    analyticsEvents.uploadRecording(file.size);

    const response = await fetch(
      `${API_URL_PROCESSING}/appointments/upload-recording-try`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload recording error:', errorText);
      throw new Error(`Failed to upload recording: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    console.error('❌ Failed to upload recording:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to upload recording';
    console.error('❌ Failed to update appointment status to Error:', errorMsg);
    throw new Error(errorMsg);
  }
}
