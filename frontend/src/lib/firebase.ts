import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, logEvent, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app, 'appointments-db'); // Use 'appointments-db' as the Firestore database name

// Initialize Firebase Analytics
let analytics: Analytics | null = null;
try {
  analytics = getAnalytics(app);
  console.log('✅ Firebase Analytics initialized');
  
  // Enable debug mode for local development
  if (import.meta.env.DEV && analytics) {
    // @ts-ignore - setAnalyticsCollectionEnabled is available but not in types
    window.gtag?.('config', import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, {
      debug_mode: true
    });
    console.log('🔍 Analytics debug mode enabled - check Firebase DebugView');
  }
} catch (error) {
  console.warn('⚠️ Firebase Analytics not available:', error);
}

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Analytics helper functions
export const logAnalyticsEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, eventParams);
      console.log(`📊 Analytics event logged: ${eventName}`, eventParams);
    } catch (error) {
      console.error('❌ Failed to log analytics event:', error);
    }
  }
};

// Predefined analytics events
export const analyticsEvents = {
  startRecording: (appointmentId: string) => {
    logAnalyticsEvent('start_recording', { appointment_id: appointmentId });
  },
  finalizeAppointment: (appointmentId: string) => {
    logAnalyticsEvent('finalize_appointment', { appointment_id: appointmentId });
  },
  userLogin: (method: string) => {
    logAnalyticsEvent('login', { method });
  },
  appOpen: () => {
    logAnalyticsEvent('app_open');
  },
  viewAppointmentDetail: (appointmentId: string) => {
    logAnalyticsEvent('view_appointment_detail', { appointment_id: appointmentId });
  },
  generateQuestions: (appointmentId: string) => {
    logAnalyticsEvent('generate_questions', { appointment_id: appointmentId });
  },
  uploadRecording: (appointmentId: string, fileSize?: number) => {
    logAnalyticsEvent('upload_recording', { 
      appointment_id: appointmentId,
      file_size: fileSize 
    });
  },
  tryAsGuest: () => {
    logAnalyticsEvent('try_as_guest');
  },
};
