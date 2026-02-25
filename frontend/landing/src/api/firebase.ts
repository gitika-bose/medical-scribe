import { initializeApp, getApps } from 'firebase/app';

// =============================================================================
// Firebase configuration (web – Vite env vars)
// =============================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase (only once)
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// =============================================================================
// Processing service URL & health check
// =============================================================================

const API_URL_PROCESSING = import.meta.env.VITE_API_PROCESSING_URL;

export async function checkProcessingServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL_PROCESSING}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return false;
    const data = await response.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}
