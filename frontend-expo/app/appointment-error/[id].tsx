import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { getSingleAppointment, type AppointmentWithId } from '@/api/appointments';
import { formatAppointmentDate, formatAppointmentDateLong } from '@/utils/formatDate';
import { DeleteAppointmentButton } from '@/components/shared/DeleteAppointmentButton';

export default function AppointmentErrorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();

  const [appointment, setAppointment] = useState<AppointmentWithId | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      if (!id) {
        setError('Invalid appointment ID');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getSingleAppointment(id);

        if (!data) {
          setError('Appointment not found');
          setIsLoading(false);
          return;
        }

        // If not an error appointment, redirect to normal detail view
        if (data.status !== 'Error') {
          router.replace(`/appointment/${id}` as any);
          return;
        }

        setAppointment(data);
      } catch (err) {
        console.error('Failed to fetch appointment:', err);
        setError('Failed to load appointment');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id, user, authLoading]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getAppointmentTitle = (): string => {
    if (!appointment) return 'Appointment Details';
    if (appointment.title) return appointment.title;
    if (appointment.doctor) return appointment.doctor;
    if (appointment.location) return `Appointment at ${appointment.location}`;
    return 'Appointment Details';
  };

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/appointments' as any);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.centeredText}>Loading appointment...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error / not found
  // ---------------------------------------------------------------------------
  if (error || !appointment) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.centeredText}>{error || 'Appointment not found'}</Text>
        <TouchableOpacity onPress={navigateBack}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: '#991B1B' }]} numberOfLines={1}>
            {getAppointmentTitle()}
          </Text>
          <Text style={styles.headerDate}>
            {formatAppointmentDate(appointment.appointmentDate)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error Alert */}
        <View style={styles.errorAlert}>
          <View style={styles.errorAlertHeader}>
            <Ionicons name="alert-circle" size={24} color="#DC2626" />
            <View style={styles.errorAlertContent}>
              <Text style={styles.errorAlertTitle}>Processing Error</Text>
              <Text style={styles.errorAlertDescription}>
                We encountered an error while processing this appointment.
              </Text>
              {appointment.error && (
                <View style={styles.errorDetailBox}>
                  <Text style={styles.errorDetailText}>{appointment.error}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Appointment Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeading}>Appointment Details</Text>
          <View style={styles.detailsList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {formatAppointmentDateLong(appointment.appointmentDate)}
              </Text>
            </View>
            {appointment.title && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{appointment.title}</Text>
              </View>
            )}
            {appointment.doctor && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Doctor</Text>
                <Text style={styles.detailValue}>{appointment.doctor}</Text>
              </View>
            )}
            {appointment.location && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{appointment.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Feedback button */}
        <TouchableOpacity
          style={styles.feedbackButton}
          onPress={() => {
            console.log('Feedback button clicked for appointment:', appointment.appointmentId);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbox-outline" size={20} color="#fff" />
          <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
        </TouchableOpacity>

        {/* Delete */}
        <DeleteAppointmentButton appointmentId={id!} onDeleteError={setError} />
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
    backgroundColor: '#F9FAFB',
  },

  // Centered states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  centeredText: {
    fontSize: 15,
    color: '#6B7280',
  },
  linkText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  // Error alert
  errorAlert: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 20,
  },
  errorAlertHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  errorAlertContent: {
    flex: 1,
  },
  errorAlertTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#7F1D1D',
    marginBottom: 8,
  },
  errorAlertDescription: {
    fontSize: 15,
    color: '#991B1B',
    marginBottom: 12,
  },
  errorDetailBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
  },
  errorDetailText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: 'SpaceMono',
  },

  // Details card
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  detailsHeading: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {},
  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#111',
  },

  // Feedback button
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
