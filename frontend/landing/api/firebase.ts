import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is exported from the RN-specific build resolved by Metro
import { initializeAuth, getReactNativePersistence, getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// Firebase configuration (same values as the web app)
// =============================================================================
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (only once)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth & Firestore – use initializeAuth with AsyncStorage for persistent sessions
// Use getAuth fallback for hot-reload scenarios where auth is already initialized
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}
export { auth };
export const googleProvider = new GoogleAuthProvider();

// Use named database 'appointments-db' to match web app
export const db = getFirestore(app, 'appointments-db');

// =============================================================================
// Processing service URL & health check
// =============================================================================

const API_URL_PROCESSING = process.env.EXPO_PUBLIC_API_PROCESSING_URL;

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
