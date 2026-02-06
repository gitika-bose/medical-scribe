import { auth } from '@/lib/firebase';

const API_URL_CRUD = import.meta.env.VITE_API_CRUD_URL || 'http://localhost:8080';
const API_URL_PROCESSING = import.meta.env.VITE_API_PROCESSING_URL || 'http://localhost:8081';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function startAppointment(): Promise<{ appointmentId: string }> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_URL_CRUD}/appointments`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to start appointment: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadAudioChunk(
  appointmentId: string,
  audioChunk: Blob
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('audioChunk', audioChunk, 'chunk.webm');

  const response = await fetch(
    `${API_URL_CRUD}/appointments/${appointmentId}/audio-chunks`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload audio chunk error:', errorText);
    throw new Error(`Failed to upload audio chunk: ${response.statusText}`);
  }
}

export async function generateQuestions(
  appointmentId: string
): Promise<{ questions: string[] }> {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/generate-questions`,
    {
      method: 'POST',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to generate questions: ${response.statusText}`);
  }

  return response.json();
}

export async function finalizeAppointment(
  appointmentId: string,
  fullAudio: Blob | null
): Promise<{ soapNotes: any }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();

  const formData = new FormData();
  if (fullAudio) {
    formData.append('fullAudio', fullAudio, 'recording.webm');
  }

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/finalize`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Finalize appointment error:', errorText);
    throw new Error(`Failed to finalize appointment: ${response.statusText}`);
  }

  return response.json();
}

export async function getAppointments(): Promise<{ appointments: any[]; count: number }> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL_CRUD}/appointments`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch appointments: ${response.statusText}`);
  }

  return response.json();
}

export async function getAppointment(appointmentId: string): Promise<any> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL_CRUD}/appointments/${appointmentId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch appointment: ${response.statusText}`);
  }

  return response.json();
}

export async function uploadRecording(
  appointmentId: string,
  recordingFile: File
): Promise<{ status: string; soapNotes: any; recordingLink: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('recording', recordingFile);

  const response = await fetch(
    `${API_URL_CRUD}/appointments/${appointmentId}/upload-recording`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload recording error:', errorText);
    throw new Error(`Failed to upload recording: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteAppointment(appointmentId: string): Promise<void> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL_CRUD}/appointments/${appointmentId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete appointment: ${response.statusText}`);
  }
}
