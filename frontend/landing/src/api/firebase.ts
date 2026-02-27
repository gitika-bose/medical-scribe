import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  type Auth,
  type User,
} from 'firebase/auth';

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
console.log(firebaseConfig);

// Initialize Firebase (only once)
export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// =============================================================================
// Guest / test-user credentials from environment
// =============================================================================

const GUEST_TEST_EMAIL = import.meta.env.VITE_GUEST_TEST_EMAIL;
const GUEST_TEST_PASSWORD = import.meta.env.VITE_GUEST_TEST_PASSWORD;

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

// =============================================================================
// Guest Auth helpers
// =============================================================================

/**
 * Sign in as the shared guest/test account.
 * Reuses the existing session if already signed in as guest.
 * Returns the Firebase User.
 */
export async function signInAsGuest(): Promise<User> {
  // If already signed in, return the current user
  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!GUEST_TEST_EMAIL || !GUEST_TEST_PASSWORD) {
    throw new Error('Guest test credentials are not configured');
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    GUEST_TEST_EMAIL,
    GUEST_TEST_PASSWORD,
  );
  return userCredential.user;
}

/**
 * Get the current user's Firebase ID token.
 * Automatically signs in as guest if no user is authenticated.
 */
export async function getAuthToken(): Promise<string> {
  let user = auth.currentUser;

  if (!user) {
    user = await signInAsGuest();
  }

  const token = await user.getIdToken();
  return token;
}
