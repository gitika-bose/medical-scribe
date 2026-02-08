import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  Timestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';

const API_URL_CRUD = import.meta.env.VITE_API_CRUD_URL || 'http://localhost:8080';
const API_URL_PROCESSING = import.meta.env.VITE_API_PROCESSING_URL || 'http://localhost:8081';

// Health check function
export async function checkProcessingServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL_PROCESSING}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Processing service health check failed:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✅ Processing service is healthy:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('❌ Processing service health check error:', error);
    return false;
  }
}

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

// Create appointment directly in Firestore
export async function startAppointment(): Promise<{ appointmentId: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Create appointment document with auto-generated ID under /users/{userId}/appointments
    const appointmentsRef = collection(db, 'users', user.uid, 'appointments');
    const appointmentRef = doc(appointmentsRef);
    const appointmentId = appointmentRef.id;
    
    const appointmentData = {
      status: 'InProgress' as const,
      appointmentDate: Timestamp.fromDate(new Date()),
    };
    
    await setDoc(appointmentRef, appointmentData);
    
    return { appointmentId };
  } catch (error) {
    console.error('Failed to create appointment:', error);
    throw new Error('Failed to start appointment');
  }
}

export async function uploadAudioChunk(
  appointmentId: string,
  audioChunk: Blob
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('User not authenticated');
    console.error('❌ Failed to upload audio chunk:', error);
    throw error;
  }

  if (!appointmentId) {
    const error = new Error('Invalid appointment ID');
    console.error('❌ Failed to upload audio chunk:', error);
    throw error;
  }

  if (!audioChunk || audioChunk.size === 0) {
    console.warn('⚠️ Skipping upload of empty audio chunk');
    return;
  }

  // Check service health before uploading
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    const error = new Error('Service is currently unavailable. Please try again later.');
    console.error('❌ Failed to upload audio chunk:', error);
    throw error;
  }
  
  try {
    const token = await user.getIdToken();

    const formData = new FormData();
    formData.append('audioChunk', audioChunk, 'chunk.webm');

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/audio-chunks`,
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
      console.error('❌ Upload audio chunk error:', errorText);
      throw new Error(`Failed to upload audio chunk: ${response.statusText}`);
    }
  } catch (err) {
    console.error('❌ Failed to upload audio chunk:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to upload audio chunk';
    throw new Error(errorMsg);
  }
}

export async function generateQuestions(
  appointmentId: string
): Promise<{ questions: string[] }> {
  // Check service health before generating questions
  const isHealthy = await checkProcessingServiceHealth();
  if (!isHealthy) {
    throw new Error('Service is currently unavailable. Please try again later.');
  }

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
    const error = new Error('User not authenticated');
    console.error('❌ Failed to finalize appointment:', error);
    throw error;
  }

  if (!appointmentId) {
    const error = new Error('Invalid appointment ID');
    console.error('❌ Failed to finalize appointment:', error);
    throw error;
  }

  try {
    // Check service health before finalizing
    const isHealthy = await checkProcessingServiceHealth();
    if (!isHealthy) {
      const error = new Error('Service is currently unavailable. Please try again later.');
      console.error('❌ Failed to finalize appointment:', error);
      
      // Set appointment status to error in Firestore
      try {
        const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
          status: 'Error',
          error: 'Service unavailable'
        });
        console.log('✅ Appointment status set to Error due to unhealthy service');
      } catch (updateErr) {
        console.error('❌ Failed to update appointment status to Error:', updateErr);
      }
      
      throw error;
    }
    
    const token = await user.getIdToken();

    const formData = new FormData();
    if (fullAudio && fullAudio.size > 0) {
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
      const errorText = await response.json();
      console.error('❌ Finalize appointment error:', errorText);
      throw new Error(`Failed to finalize appointment: ${errorText.message || response.statusText}`);
    }

    return response.json();
  } catch (err) {
    console.error('❌ Failed to finalize appointment:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to finalize recording';
    
    // Set appointment status to error in Firestore if not already done
    try {
      const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
      const docSnap = await getDoc(appointmentRef);
      
      // Only update if status is not already Error
      if (docSnap.exists() && docSnap.data().status !== 'Error') {
        await updateDoc(appointmentRef, {
          status: 'Error',
          error: errorMsg
        });
        console.log('✅ Appointment status set to Error due to finalization failure');
      }
    } catch (updateErr) {
      console.error('❌ Failed to update appointment status to Error:', updateErr);
    }
    
    throw new Error(errorMsg);
  }
}

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

// Extended type for appointments with ID
export interface AppointmentWithId extends Appointment {
  appointmentId: string;
}

// Fetch appointments directly from Firestore
export async function fetchAppointments(): Promise<AppointmentWithId[]> {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error("User not authenticated");
    console.error("❌ Failed to fetch appointments:", error);
    throw error;
  }

  try {
    const appointmentsRef = collection(db, "users", user.uid, "appointments");
    const querySnapshot = await getDocs(appointmentsRef);
    const appointments: AppointmentWithId[] = [];
    
    querySnapshot.forEach((docSnap) => {
      try {
        const data = docSnap.data();
        
        // Validate required fields
        if (!data.appointmentDate) {
          console.warn(`⚠️ Skipping appointment ${docSnap.id} - missing required fields`);
          return;
        }
        
        appointments.push({
          appointmentId: docSnap.id,
          status: data.status || 'InProgress',
          appointmentDate: data.appointmentDate.toDate().toISOString(),
          title: data.title,
          doctor: data.doctor,
          location: data.location,
          processedSummary: data.processedSummary,
          rawTranscript: data.rawTranscript,
          recordingLink: data.recordingLink,
          error: data.error,
        });
      } catch (docErr) {
        console.error(`❌ Failed to process appointment ${docSnap.id}:`, docErr);
        // Continue processing other appointments
      }
    });

    appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    
    return appointments;
  } catch (err) {
    console.error("❌ Failed to fetch appointments:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to load appointments";
    throw new Error(errorMsg);
  }
}

// Get single appointment directly from Firestore
export async function getSingleAppointment(appointmentId: string): Promise<AppointmentWithId | null> {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error("User not authenticated");
    console.error("❌ Failed to fetch appointment:", error);
    throw error;
  }

  if (!appointmentId) {
    const error = new Error("Invalid appointment ID");
    console.error("❌ Failed to fetch appointment:", error);
    throw error;
  }

  try {
    const appointmentRef = doc(db, "users", user.uid, "appointments", appointmentId);
    const docSnap = await getDoc(appointmentRef);

    if (!docSnap.exists()) {
      console.warn(`⚠️ Appointment ${appointmentId} not found`);
      return null;
    }

    const data = docSnap.data();

    // Validate required fields
    if (!data.appointmentDate) {
      console.warn(`⚠️ Appointment ${appointmentId} missing appointmentDate`);
      throw new Error("Appointment data is incomplete");
    }

    return {
      appointmentId: appointmentId,
      status: data.status || 'InProgress',
      appointmentDate: data.appointmentDate.toDate().toISOString(),
      title: data.title,
      doctor: data.doctor,
      location: data.location,
      processedSummary: data.processedSummary,
      rawTranscript: data.rawTranscript,
      recordingLink: data.recordingLink,
      error: data.error,
    };
  } catch (err) {
    console.error("❌ Failed to fetch appointment:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to load appointment";
    throw new Error(errorMsg);
  }
}

export async function uploadRecording(
  appointmentId: string,
  recordingFile: File
): Promise<{ status: string; soapNotes: any; recordingLink: string }> {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('User not authenticated');
    console.error('❌ Failed to upload recording:', error);
    throw error;
  }

  if (!appointmentId) {
    const error = new Error('Invalid appointment ID');
    console.error('❌ Failed to upload recording:', error);
    throw error;
  }

  if (!recordingFile || recordingFile.size === 0) {
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
      
      // Set appointment status to error in Firestore
      try {
        const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
          status: 'Error',
          error: 'Service unavailable'
        });
        console.log('✅ Appointment status set to Error due to unhealthy service');
      } catch (updateErr) {
        console.error('❌ Failed to update appointment status to Error:', updateErr);
      }
      
      throw error;
    }
    
    const token = await user.getIdToken();

    const formData = new FormData();
    formData.append('recording', recordingFile);

  const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}/upload-recording`,
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
      console.error('❌ Upload recording error:', errorText);
      throw new Error(`Failed to upload recording: ${response.statusText}`);
    }

    return response.json();
  } catch (err) {
    console.error('❌ Failed to upload recording:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to upload recording';
    
    // Set appointment status to error in Firestore if not already done
    try {
      const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
      const docSnap = await getDoc(appointmentRef);
      
      // Only update if status is not already Error
      if (docSnap.exists() && docSnap.data().status !== 'Error') {
        await updateDoc(appointmentRef, {
          status: 'Error',
          error: errorMsg
        });
        console.log('✅ Appointment status set to Error due to upload recording failure');
      }
    } catch (updateErr) {
      console.error('❌ Failed to update appointment status to Error:', updateErr);
    }
    
    throw new Error(errorMsg);
  }
}

// Delete appointment directly from Firestore
export async function deleteAppointment(appointmentId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
    const docSnap = await getDoc(appointmentRef);

    if (!docSnap.exists()) {
      throw new Error('Appointment not found');
    }

    await deleteDoc(appointmentRef);
  
    const token = await user.getIdToken();

    const response = await fetch(
    `${API_URL_PROCESSING}/appointments/${appointmentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      }
    } )
  } catch (error) {
    console.error('Failed to delete appointment:', error);
    throw new Error('Failed to delete appointment');
  }
}

// Update appointment metadata directly in Firestore
export async function updateAppointmentMetadata(
  appointmentId: string,
  metadata: {
    title?: string;
    doctor?: string;
    location?: string;
    appointmentDate?: Date;
  }
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const appointmentRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
    const docSnap = await getDoc(appointmentRef);

    if (!docSnap.exists()) {
      throw new Error('Appointment not found');
    }

    const updates: any = {};

    if (metadata.title !== undefined) {
      updates.title = metadata.title;
    }

    if (metadata.doctor !== undefined) {
      updates.doctor = metadata.doctor;
    }

    if (metadata.location !== undefined) {
      updates.location = metadata.location;
    }

    if (metadata.appointmentDate) {
      updates.appointmentDate = Timestamp.fromDate(metadata.appointmentDate);
    }

    await updateDoc(appointmentRef, updates);
  } catch (error) {
    console.error('Failed to update appointment metadata:', error);
    throw new Error('Failed to update appointment metadata');
  }
}

// Listen to InProgress appointments status changes in real-time
export function listenToInProgressAppointments(
  onUpdate: (appointments: AppointmentWithId[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const user = auth.currentUser;
  if (!user) {
    const error = new Error('User not authenticated');
    console.error('❌ Failed to setup listener:', error);
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }

  try {
    const appointmentsRef = collection(db, 'users', user.uid, 'appointments');
    const q = query(
      appointmentsRef,
      where('status', '==', 'InProgress')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const appointments: AppointmentWithId[] = [];
        
        snapshot.forEach((docSnap) => {
          try {
            const data = docSnap.data();
            
            // Validate required fields
            if (!data.appointmentDate) {
              console.warn(`⚠️ Skipping appointment ${docSnap.id} - missing required fields`);
              return;
            }
            
            appointments.push({
              appointmentId: docSnap.id,
              status: data.status || 'InProgress',
              appointmentDate: data.appointmentDate.toDate().toISOString(),
              title: data.title,
              doctor: data.doctor,
              location: data.location,
              processedSummary: data.processedSummary,
              rawTranscript: data.rawTranscript,
              recordingLink: data.recordingLink,
              error: data.error,
            });
          } catch (docErr) {
            console.error(`❌ Failed to process appointment ${docSnap.id}:`, docErr);
          }
        });

        // Sort by date descending
        appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
        
        console.log('📡 InProgress appointments updated:', appointments.length);
        onUpdate(appointments);
      },
      (error) => {
        console.error('❌ Listener error:', error);
        if (onError) onError(error as Error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('❌ Failed to setup listener:', err);
    const error = err instanceof Error ? err : new Error('Failed to setup listener');
    if (onError) onError(error);
    return () => {}; // Return empty unsubscribe function
  }
}
