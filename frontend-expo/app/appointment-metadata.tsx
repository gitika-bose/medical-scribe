import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { store } from '@/store';
import { updateAppointmentMetadata } from '@/api/appointments';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';

export default function AppointmentMetadataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the last completed appointment ID from store
  const appointmentId = store.getLastCompletedAppointmentId();

  useEffect(() => {
    // If no appointment ID, redirect to home
    if (!appointmentId) {
      router.replace('/(tabs)' as any);
    }
  }, [appointmentId]);

  const handleSave = async () => {
    if (!appointmentId) {
      setError('No appointment ID found');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await updateAppointmentMetadata(appointmentId, {
        title: title || undefined,
        doctor: doctorName || undefined,
        location: location || undefined,
        appointmentDate: selectedDate,
      });

      // Clear the last completed appointment ID
      store.clearLastCompletedAppointmentId();

      // Navigate to appointments list
      router.replace('/(tabs)/appointments' as any);
    } catch (err) {
      console.error('Error saving metadata:', err);
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to save appointment data';
      setError(errorMsg);
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    store.clearLastCompletedAppointmentId();
    router.replace('/(tabs)/appointments' as any);
  };

  // Format date for display
  const formatDisplayDate = (date: Date): string => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Guest disclaimer banner */}
      <GuestDisclaimer />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Appointment Details</Text>
        <Text style={styles.subtitle}>
          Add details about your appointment (optional)
        </Text>

        {/* Error */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Annual Checkup"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            editable={!isSaving}
          />
        </View>

        {/* Doctor */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Doctor Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Dr. Smith"
            placeholderTextColor="#9CA3AF"
            value={doctorName}
            onChangeText={setDoctorName}
            editable={!isSaving}
          />
        </View>

        {/* Location */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="City Medical Center"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
            editable={!isSaving}
          />
        </View>

        {/* Date display */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date &amp; Time</Text>
          <View style={styles.dateDisplay}>
            <Ionicons name="calendar-outline" size={18} color="#6B7280" />
            <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>

        {/* Skip link */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isSaving}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },

  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
  },

  // Error
  errorBanner: {
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },

  // Fields
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#fff',
  },

  // Date
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 15,
    color: '#374151',
  },

  // Save button
  saveButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Skip button
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
});
