// Mock store for managing appointments
export interface Appointment {
  id: string;
  date: string;
  summary: string;
  plan: string[];
  notes: string;
  documents: string[];
}

let appointments: Appointment[] = [];
let currentRecordingId: string | null = null;

export const store = {
  getAppointments: () => appointments,
  
  getAppointment: (id: string) => 
    appointments.find(apt => apt.id === id),
  
  addAppointment: (appointment: Appointment) => {
    appointments = [...appointments, appointment];
    return appointment;
  },
  
  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    appointments = appointments.map(apt => 
      apt.id === id ? { ...apt, ...updates } : apt
    );
  },
  
  startRecording: (appointmentId?: string) => {
    currentRecordingId = appointmentId || Date.now().toString();
    return currentRecordingId;
  },
  
  getCurrentRecordingId: () => currentRecordingId,
  
  endRecording: () => {
    const id = currentRecordingId;
    currentRecordingId = null;
    return id;
  },
};
