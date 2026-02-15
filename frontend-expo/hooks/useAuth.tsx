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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Whether the Google Sign-In request is ready to be triggered */
  isGoogleSignInReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up the Google ID-token auth request
  const [request, _response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
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

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
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
    isGoogleSignInReady: !!request,
    signInWithGoogle,
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
