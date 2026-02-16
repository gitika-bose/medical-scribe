import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteAppointment } from '@/api/appointments';
import { AlertModal } from './AlertModal';

interface DeleteAppointmentButtonProps {
  appointmentId: string;
  onDeleteStart?: () => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * A reusable delete button that shows a confirmation dialog before deleting
 * an appointment, then navigates back to the appointments list.
 */
export function DeleteAppointmentButton({
  appointmentId,
  onDeleteStart,
  onDeleteSuccess,
  onDeleteError,
  style,
}: DeleteAppointmentButtonProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      onDeleteStart?.();

      await deleteAppointment(appointmentId);

      onDeleteSuccess?.();
      // Navigate back to appointments tab
      router.replace('/(tabs)/appointments' as any);
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to delete appointment';
      onDeleteError?.(errorMsg);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.deleteButton, style]}
        onPress={handleDeleteClick}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete Appointment</Text>
      </TouchableOpacity>

      <AlertModal
        visible={showDeleteConfirm}
        title="Delete Appointment?"
        description="This will permanently delete this appointment and all associated recordings. This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
