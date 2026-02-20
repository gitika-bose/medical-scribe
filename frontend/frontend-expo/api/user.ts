import { doc, getDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { deleteUser as firebaseDeleteUser } from 'firebase/auth';

import { auth, db } from './firebase';

const API_URL_PROCESSING = process.env.EXPO_PUBLIC_API_PROCESSING_URL;

// =============================================================================
// Auth helpers (internal)
// =============================================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// =============================================================================
// User Account API
// =============================================================================

/**
 * Delete the current user's account and all associated data.
 * This includes:
 * - Calling backend DELETE API for each appointment
 * - Deleting all appointments from Firestore
 * - Deleting the user document from Firestore
 * - Deleting the Firebase Auth account
 */
export async function deleteUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const token = await user.getIdToken();

    // Step 1: Get all appointments for the user
    const appointmentsRef = collection(db, 'users', user.uid, 'appointments');
    const appointmentsSnapshot = await getDocs(appointmentsRef);

    // Step 2: Call backend DELETE API for each appointmentId
    const deleteBackendPromises = appointmentsSnapshot.docs.map(async (appointmentDoc) => {
      const appointmentId = appointmentDoc.id;
      try {
        await fetch(`${API_URL_PROCESSING}/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (backendErr) {
        console.error(`Failed to delete appointment ${appointmentId} from backend:`, backendErr);
        // Continue deleting other appointments even if one fails
      }
    });

    await Promise.all(deleteBackendPromises);

    // Step 3: Delete all appointment documents from Firestore
    const deleteFirestorePromises = appointmentsSnapshot.docs.map(async (appointmentDoc) => {
      try {
        await deleteDoc(appointmentDoc.ref);
      } catch (firestoreErr) {
        console.error(`Failed to delete appointment ${appointmentDoc.id} from Firestore:`, firestoreErr);
        // Continue deleting other appointments even if one fails
      }
    });

    await Promise.all(deleteFirestorePromises);

    // Step 4: Delete user profile from users collection
    try {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
    } catch (err) {
      console.error('Failed to delete user document:', err);
      // Continue with account deletion
    }

    // Step 5: Delete the Firebase Auth account
    await firebaseDeleteUser(user);
  } catch (error: any) {
    console.error('Error deleting account:', error);

    // Provide more specific error messages
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please reauthenticate before deleting your account.');
    } else {
      throw new Error('Failed to delete account. Please try again.');
    }
  }
}
