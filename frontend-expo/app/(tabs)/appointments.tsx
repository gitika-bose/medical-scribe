import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  startAppointment,
  uploadRecording,
  fetchAppointments,
  listenToInProgressAppointments,
  type AppointmentWithId,
} from '@/api/appointments';
import { formatAppointmentDate } from '@/utils/formatDate';

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
  const handleNewAppointment = () => {
    setShowDropdown(false);
    setIsStarting(true);
    router.push('/(tabs)' as any);
    setIsStarting(false);
  };

  const handleAppointmentClick = (appointment: AppointmentWithId) => {
    if (appointment.status === 'Error') {
      router.push(`/appointment-error/${appointment.appointmentId}` as any);
    } else {
      router.push(`/appointment/${appointment.appointmentId}` as any);
    }
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

        {isInProgress ? (
          <ActivityIndicator size="small" color="#2563EB" style={styles.cardIcon} />
        ) : isError ? (
          <Ionicons name="alert-circle" size={20} color="#DC2626" style={styles.cardIcon} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={styles.cardIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Juno</Text>

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
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newButtonText}>
              {isStarting ? 'Starting...' : 'New'}
            </Text>
          </TouchableOpacity>

          {/* Dropdown */}
          {showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleNewAppointment}
                disabled={isStarting}
              >
                <Ionicons name="mic" size={20} color="#2563EB" />
                <Text style={styles.dropdownText}>Live Recording</Text>
              </TouchableOpacity>
              {/* Upload Recording could be added here when file picker is wired */}
            </View>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
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

      {/* Processing banner */}
      {isProcessing && (
        <View style={[styles.processingBanner, { paddingBottom: insets.bottom + 60 }]}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.processingText}>Processing recent appointment upload...</Text>
        </View>
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
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },

  // New button
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  newButtonDisabled: {
    opacity: 0.5,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    color: '#111',
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
    color: '#6B7280',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },

  // Appointment card
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  cardInProgress: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  cardContent: {
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardDateError: {
    color: '#DC2626',
  },
  cardDateInProgress: {
    color: '#2563EB',
  },
  cardTitle: {
    fontSize: 15,
    color: '#111',
  },
  cardTitleError: {
    color: '#7F1D1D',
  },
  cardTitleInProgress: {
    color: '#1E3A8A',
  },
  cardIcon: {
    marginLeft: 12,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  // Processing banner
  processingBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
  },
});
