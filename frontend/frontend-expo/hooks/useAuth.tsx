import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { auth, db } from '@/api/firebase';

// ---------------------------------------------------------------------------
// Complete any pending auth sessions (required for expo-auth-session)
// ---------------------------------------------------------------------------
WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
// OAuth 2.0 Client IDs from Google Cloud Console
// (Firebase Console → Authentication → Sign-in method → Google)
// ---------------------------------------------------------------------------
const GOOGLE_WEB_CLIENT_ID = '798703978932-0ovpaoc9kjvh4c9gia3ehh2apksn2ftb.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '798703978932-p4si3epr4e91r4ecno285h45rl6q0ij0.apps.googleusercontent.com';

// ---------------------------------------------------------------------------
// Guest / test-user credentials from environment
// ---------------------------------------------------------------------------
const GUEST_TEST_EMAIL = process.env.EXPO_PUBLIC_GUEST_TEST_EMAIL;
const GUEST_TEST_PASSWORD = process.env.EXPO_PUBLIC_GUEST_TEST_PASSWORD;
const GUEST_TEST_USERID = process.env.EXPO_PUBLIC_GUEST_TEST_USERID;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Whether the current user is the shared guest/test account */
  isGuestUser: boolean;
  /** Whether the Google Sign-In request is ready to be triggered */
  isGoogleSignInReady: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Sign in automatically with the shared guest/test account */
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * In-memory flag that tracks whether the guest was signed in during THIS
 * session.  Because it lives in JS module scope it is lost on every
 * page-refresh / app restart, which is exactly what we want: if the flag
 * is *not* set but Firebase restores a guest user from persistence we
 * know the session is stale and sign the user out immediately.
 */
let guestSessionActive = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuestUser, setIsGuestUser] = useState(false);

  // Set up the Google ID-token auth request
  const [request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Auto sign-out stale guest sessions:
      // If the restored user is the guest account but the in-memory flag
      // is not set, that means the app was refreshed / restarted → sign out.
      if (
        firebaseUser &&
        GUEST_TEST_USERID &&
        firebaseUser.uid === GUEST_TEST_USERID &&
        !guestSessionActive
      ) {
        console.log('Stale guest session detected — signing out automatically.');
        await firebaseSignOut(auth);
        // onAuthStateChanged will fire again with null
        return;
      }

      setUser(firebaseUser);

      // Check if the current user is the guest test account
      if (firebaseUser && GUEST_TEST_USERID) {
        setIsGuestUser(firebaseUser.uid === GUEST_TEST_USERID);
      } else {
        setIsGuestUser(false);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Trigger the Google Sign-In flow via the system browser,
   * then sign in to Firebase with the returned ID token.
   */
  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();

      if (result?.type === 'success') {
        const idToken = result.params.id_token;
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const firebaseUser = userCredential.user;

        // Create user document in Firestore if it doesn't exist
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Anonymous',
            createdAt: Timestamp.now(),
          });
        }
      } else if (result?.type === 'cancel' || result?.type === 'dismiss') {
        // User intentionally cancelled – don't treat as an error
        console.log('Google Sign-In was cancelled by user');
        return;
      } else {
        throw new Error('Sign-in failed');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  /**
   * Sign in with the shared guest/test account using email & password.
   * Sets the in-memory flag so the session is recognized as intentional.
   */
  const signInAsGuest = async () => {
    if (!GUEST_TEST_EMAIL || !GUEST_TEST_PASSWORD) {
      throw new Error('Guest test credentials are not configured');
    }

    try {
      guestSessionActive = true;
      await signInWithEmailAndPassword(auth, GUEST_TEST_EMAIL, GUEST_TEST_PASSWORD);
      // onAuthStateChanged will set user & isGuestUser automatically
    } catch (error) {
      guestSessionActive = false;
      console.error('Error signing in as guest:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      guestSessionActive = false;
      await firebaseSignOut(auth);
      setIsGuestUser(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isGuestUser,
    isGoogleSignInReady: !!request,
    signInWithGoogle,
    signInAsGuest,
    signOut: handleSignOut,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
