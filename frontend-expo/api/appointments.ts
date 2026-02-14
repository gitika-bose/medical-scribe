import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import { auth, db, checkProcessingServiceHealth } from './firebase';
import { analyticsEvents } from './analytics';

const API_URL_PROCESSING = process.env.EXPO_PUBLIC_API_PROCESSING_URL;

// =============================================================================
// Auth helpers (internal)
// =============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// =============================================================================
// Appointments API
// =============================================================================

export async function startAppointment(): Promise<{ appointmentId: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const appointmentsRef = collection(db, 'users', user.uid, 'appointments');
    const appointmentRef = doc(appointmentsRef);
    const appointmentId = appointmentRef.id;

    await setDoc(appointmentRef, {
      status: 'InProgress' as const,
      appointmentDate: Timestamp.fromDate(new Date()),
      createdDate: Timestamp.fromDate(new Date()),
    });

    return { appointmentId };
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw new Error('Failed to start appointment');
  }
}

/**
 * Upload an audio chunk.
 * Accepts a file URI string (React Native) or a Blob (web).
 */
export async function uploadAudioChunk(
  appointmentId: string,
  audioChunk: string | Blob,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  if (!appointmentId) throw new Error('Invalid appointment ID');

  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

  try {
    const token = await user.getIdToken();
    const formData = new FormData();

    if (typeof audioChunk === 'string') {
      // React Native file URI
      formData.append('audioChunk', {
        uri: audioChunk,
        type: 'audio/m4a',
        name: 'chunk.m4a',
      } as any);
    } else {
      formData.append('audioChunk', audioChunk, 'chunk.webm');
    }

    const response = await fetch(
      `${API_URL_PROCESSING}/appointments/${appointmentId}/audio-chunks`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload audio chunk error:', errorText);
      throw new Error(`Failed to upload audio chunk: ${response.statusText}`);
    }
  } catch (err) {
    console.error('❌ Failed to upload audio chunk:', err);
    throw new Error(err instanceof Error ? err.message : 'Failed to upload audio chunk');
  }
}

export async function generateQuestions(
  appointmentId: string,
): Promise<{ questions: string[] }> {
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/generate-questions`,
    { method: 'POST', headers },
  );

  if (!response.ok) {
    throw new Error(`Failed to generate questions: ${response.statusText}`);
  }
  return response.json();
}

export async function finalizeAppointment(
  appointmentId: string,
  fullAudioUri: string | null,
): Promise<{ soapNotes: any }> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  if (!appointmentId) throw new Error('Invalid appointment ID');

  try {
    const isHealthy = await checkProcessingServiceHealth();
    if (!isHealthy) {
      try {
        const ref = doc(db, 'users', user.uid, 'appointments', appointmentId);
        await updateDoc(ref, { status: 'Error', error: 'Service unavailable' });
      } catch (_) {}
      throw new Error('Service is currently unavailable. Please try again later.');
    }

    const token = await user.getIdToken();
    const formData = new FormData();

    if (fullAudioUri) {
      formData.append('fullAudio', {
        uri: fullAudioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
    }

    analyticsEvents.finalizeAppointment(appointmentId);

    const response = await fetch(
      `${API_URL_PROCESSING}/appointments/${appointmentId}/finalize`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorText = await response.json().catch(() => response.statusText);
      const errorMessage =
        errorText && typeof errorText === 'object' && 'error' in errorText
          ? errorText.error
          : response.statusText;
      throw new Error(`Failed to finalize appointment: ${errorMessage}`);
    }

    return response.json();
  } catch (err) {
    console.error('❌ Failed to finalize appointment:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to finalize recording';

    try {
      const ref = doc(db, 'users', user.uid, 'appointments', appointmentId);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data()?.status !== 'Error') {
        await updateDoc(ref, { status: 'Error', error: errorMsg });
      }
    } catch (_) {}

    throw new Error(errorMsg);
  }
}

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
