// Simple in-memory store for managing recording state
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
let lastCompletedAppointmentId: string | null = null;
let isRecordingActiveFlag: boolean = false;

export const store = {
  getAppointments: () => appointments,

  getAppointment: (id: string) => appointments.find((apt) => apt.id === id),

  addAppointment: (appointment: Appointment) => {
    appointments = [...appointments, appointment];
    return appointment;
  },

  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    appointments = appointments.map((apt) =>
      apt.id === id ? { ...apt, ...updates } : apt,
    );
  },

  startRecording: (appointmentId?: string) => {
    currentRecordingId = appointmentId || Date.now().toString();
    isRecordingActiveFlag = true;
    return currentRecordingId;
  },

  getCurrentRecordingId: () => currentRecordingId,

  endRecording: () => {
    const id = currentRecordingId;
    currentRecordingId = null;
    isRecordingActiveFlag = false;
    return id;
  },

  isRecordingActive: () => isRecordingActiveFlag,

  setLastCompletedAppointmentId: (appointmentId: string) => {
    lastCompletedAppointmentId = appointmentId;
  },

  getLastCompletedAppointmentId: () => lastCompletedAppointmentId,

  clearLastCompletedAppointmentId: () => {
    lastCompletedAppointmentId = null;
  },
};
