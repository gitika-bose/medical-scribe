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
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  deleteUser,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { auth, db } from '@/api/firebase';
import { deleteUserAccount } from '@/api/user';

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
  /** Sign up with email and password, creating a new user account */
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  /** Sign in with email and password */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Send password reset email to the user */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Verify password reset code and return the associated email */
  verifyPasswordResetCode: (code: string) => Promise<string>;
  /** Reset password using the reset code and new password */
  resetPassword: (code: string, newPassword: string) => Promise<void>;
  /** Reauthenticate user with password (for email/password accounts) */
  reauthenticateWithPassword: (password: string) => Promise<void>;
  /** Reauthenticate user with Google (for Google accounts) */
  reauthenticateWithGoogle: () => Promise<void>;
  /** Delete user account and all associated data */
  deleteAccount: () => Promise<void>;
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
   * Sign up a new user with email and password.
   * Creates a Firebase Auth user and a corresponding Firestore document.
   * Automatically signs the user in after successful registration.
   */
  const signUpWithEmail = async (name: string, email: string, password: string) => {
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        email: firebaseUser.email || email,
        displayName: name,
        createdAt: Timestamp.now(),
      });

      // User is automatically signed in after createUserWithEmailAndPassword
      // onAuthStateChanged will handle setting the user state
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else {
        throw new Error('Failed to create account. Please try again.');
      }
    }
  };

  /**
   * Sign in an existing user with email and password.
   * Firebase Auth automatically validates the email and password.
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check and try again.');
      } else {
        throw new Error('Failed to sign in. Please try again.');
      }
    }
  };

  /**
   * Send a password reset email to the user.
   * Firebase handles generating the secure token, sending the email,
   * and managing link expiry & validation.
   */
  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else {
        throw new Error('Failed to send password reset email. Please try again.');
      }
    }
  };

  /**
   * Verify the password reset code and return the associated email.
   */
  const verifyResetCode = async (code: string): Promise<string> => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return email;
    } catch (error: any) {
      console.error('Error verifying password reset code:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/invalid-action-code') {
        throw new Error('Invalid or expired reset code. Please request a new one.');
      } else if (error.code === 'auth/expired-action-code') {
        throw new Error('Reset code has expired. Please request a new one.');
      } else {
        throw new Error('Failed to verify reset code. Please try again.');
      }
    }
  };

  /**
   * Reset the user's password using the reset code and new password.
   */
  const resetPassword = async (code: string, newPassword: string) => {
    try {
      await confirmPasswordReset(auth, code, newPassword);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/invalid-action-code') {
        throw new Error('Invalid or expired reset code. Please request a new one.');
      } else if (error.code === 'auth/expired-action-code') {
        throw new Error('Reset code has expired. Please request a new one.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else {
        throw new Error('Failed to reset password. Please try again.');
      }
    }
  };

  /**
   * Reauthenticate the current user with their password.
   * Required before sensitive operations like account deletion.
   */
  const reauthenticateWithPassword = async (password: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    } catch (error: any) {
      console.error('Error reauthenticating with password:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      } else {
        throw new Error('Failed to verify password. Please try again.');
      }
    }
  };

  /**
   * Reauthenticate the current user with Google.
   * Required before sensitive operations like account deletion.
   */
  const reauthenticateWithGoogle = async () => {
    try {
      const result = await promptAsync();

      if (result?.type === 'success') {
        const idToken = result.params.id_token;
        const credential = GoogleAuthProvider.credential(idToken);
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('No user is currently signed in');
        }
        
        await reauthenticateWithCredential(currentUser, credential);
      } else if (result?.type === 'cancel' || result?.type === 'dismiss') {
        throw new Error('Google reauthentication was cancelled');
      } else {
        throw new Error('Reauthentication failed');
      }
    } catch (error: any) {
      console.error('Error reauthenticating with Google:', error);
      
      if (error.message === 'Google reauthentication was cancelled') {
        throw error;
      }
      throw new Error('Failed to verify with Google. Please try again.');
    }
  };

  /**
   * Delete the current user's account and all associated data.
   * Note: User must be recently authenticated before calling this.
   */
  const deleteAccount = async () => {
    try {
      // Call the centralized delete user account API
      await deleteUserAccount();
      
      // Clear guest session flag if applicable
      guestSessionActive = false;
    } catch (error: any) {
      console.error('Error deleting account:', error);
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
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    verifyPasswordResetCode: verifyResetCode,
    resetPassword,
    reauthenticateWithPassword,
    reauthenticateWithGoogle,
    deleteAccount,
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
