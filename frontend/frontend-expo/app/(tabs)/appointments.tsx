import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { store } from '@/store';
import {
  fetchAppointments,
  listenToInProgressAppointments,
  type AppointmentWithId,
} from '@/api/appointments';
import { formatAppointmentDate } from '@/utils/formatDate';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { Header } from '@/components/shared/Header';
import { Colors } from '@/constants/Colors';

export default function AppointmentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();

  const [appointments, setAppointments] = useState<AppointmentWithId[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inProgressAppointments, setInProgressAppointments] = useState<AppointmentWithId[]>([]);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // ---------------------------------------------------------------------------
  // Recording state check
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const checkRecordingState = () => {
      setIsRecordingActive(store.isRecordingActive());
    };
    checkRecordingState();
    const interval = setInterval(checkRecordingState, 500);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetched = await fetchAppointments();
        setAppointments(fetched);
      } catch (err) {
        console.error('Failed to load appointments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [user, authLoading]);

  // ---------------------------------------------------------------------------
  // Real-time listener for InProgress appointments
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = listenToInProgressAppointments(
      (updated) => {
        setInProgressAppointments(updated);
        // Refresh full list to catch status transitions
        fetchAppointments()
          .then(setAppointments)
          .catch((err) => console.error('Failed to refresh appointments:', err));
      },
      (err) => {
        console.error('❌ Listener error:', err);
      },
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  // ---------------------------------------------------------------------------
  // Merge appointments
  // ---------------------------------------------------------------------------
  const allAppointments = useMemo(() => {
    const map = new Map<string, AppointmentWithId>();
    appointments.forEach((a) => map.set(a.appointmentId, a));
    inProgressAppointments.forEach((a) => map.set(a.appointmentId, a));
    const merged = Array.from(map.values());
    merged.sort(
      (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
    );
    return merged;
  }, [appointments, inProgressAppointments]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleLiveNotes = () => {
    setShowDropdown(false);
    router.push('/notetaker' as any);
  };

  const handleUploadUnderstand = () => {
    setShowDropdown(false);
    router.push('/explain-my-appointment' as any);
  };

  const handleAppointmentClick = (appointment: AppointmentWithId) => {
    router.push(`/appointment/${appointment.appointmentId}` as any);
  };

  const getAppointmentTitle = (appointment: AppointmentWithId): string => {
    if (appointment.title) return appointment.title;
    if (appointment.doctor) return appointment.doctor;
    if (appointment.location) return `Appointment at ${appointment.location}`;
    return formatAppointmentDate(appointment.appointmentDate);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderItem = ({ item }: { item: AppointmentWithId }) => {
    const isError = item.status === 'Error';
    const isInProgress = item.status === 'InProgress';

    return (
      <TouchableOpacity
        style={[
          styles.appointmentCard,
          isError && styles.cardError,
          isInProgress && styles.cardInProgress,
        ]}
        onPress={() => handleAppointmentClick(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <Text
            style={[
              styles.cardDate,
              isError && styles.cardDateError,
              isInProgress && styles.cardDateInProgress,
            ]}
          >
            {formatAppointmentDate(item.appointmentDate)}
          </Text>
          <Text
            style={[
              styles.cardTitle,
              isError && styles.cardTitleError,
              isInProgress && styles.cardTitleInProgress,
            ]}
            numberOfLines={2}
          >
            {getAppointmentTitle(item)}
          </Text>
        </View>

        <View style={styles.cardActions}>
          {isInProgress ? (
            <ActivityIndicator size="small" color={Colors.blue[600]} />
          ) : isError ? (
            <Ionicons name="alert-circle" size={20} color={Colors.red[600]} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={Colors.gray[400]} />
        <Text style={styles.emptyTitle}>No appointments found</Text>
        <Text style={styles.emptySubtitle}>
          Start a recording to create your first appointment
        </Text>
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <Header rightContent={
        <View>
          <TouchableOpacity
            style={[
              styles.newButton,
              (isRecordingActive || isStarting || isProcessing) && styles.newButtonDisabled,
            ]}
            onPress={() => setShowDropdown(!showDropdown)}
            disabled={isStarting || isProcessing || isRecordingActive}
            activeOpacity={0.7}
          >
            <Text style={styles.newButtonText}>
              {isStarting ? 'Starting...' : 'New'}
            </Text>
          </TouchableOpacity>

          {/* Dropdown */}
          {showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleLiveNotes}
              >
                <Ionicons name="mic" size={20} color={Colors.primary} />
                <Text style={styles.dropdownText}>Appointment Notetaker</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleUploadUnderstand}
              >
                <Ionicons name="cloud-upload" size={20} color={Colors.accent4} />
                <Text style={styles.dropdownText}>Explain My Appointment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      } />

      {/* Guest disclaimer banner */}
      <GuestDisclaimer />

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.blue[600]} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={allAppointments}
          keyExtractor={(item) => item.appointmentId}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },

  // New button
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.blue[600],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  newButtonDisabled: {
    opacity: 0.5,
  },
  newButtonText: {
    color: Colors.primaryForeground,
    fontSize: 15,
    fontWeight: '600',
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 230,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 8,
    zIndex: 30,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.primary,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.gray[500],
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // Appointment card
  appointmentCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardError: {
    backgroundColor: Colors.red[50],
    borderColor: Colors.red[300],
  },
  cardInProgress: {
    backgroundColor: Colors.blue[50],
    borderColor: Colors.blue[300],
  },
  cardContent: {
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 4,
  },
  cardDateError: {
    color: Colors.red[600],
  },
  cardDateInProgress: {
    color: Colors.blue[600],
  },
  cardTitle: {
    fontSize: 15,
    color: Colors.primary,
  },
  cardTitleError: {
    color: Colors.red[900],
  },
  cardTitleInProgress: {
    color: Colors.blue[900],
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.gray[500],
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray[400],
    textAlign: 'center',
  },

  // Processing banner
  processingBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.blue[600],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  processingText: {
    color: Colors.primaryForeground,
    fontSize: 14,
  },
});
