import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (consistent with Home screen)
// ─────────────────────────────────────────────────────────────────────────────

function getAppointmentTitle(appointment: AppointmentWithId): string {
  if (appointment.title) return appointment.title;
  if (appointment.doctor) return appointment.doctor;
  if (appointment.location) return `Appointment at ${appointment.location}`;
  return formatAppointmentDate(appointment.appointmentDate);
}

function getAppointmentSubtitle(appointment: AppointmentWithId): string {
  const parts: string[] = [];
  if (appointment.doctor) parts.push(appointment.doctor);
  parts.push(formatAppointmentDate(appointment.appointmentDate));
  return parts.join(' · ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDesktop } = useResponsiveLayout();

  const [appointments, setAppointments] = useState<AppointmentWithId[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inProgressAppointments, setInProgressAppointments] = useState<AppointmentWithId[]>([]);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // Recording state check
  useEffect(() => {
    const checkRecordingState = () => {
      setIsRecordingActive(store.isRecordingActive());
    };
    checkRecordingState();
    const interval = setInterval(checkRecordingState, 500);
    return () => clearInterval(interval);
  }, []);

  // Initial load
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

  // Real-time listener for InProgress appointments
  useEffect(() => {
    if (authLoading || !user) return;

    const unsubscribe = listenToInProgressAppointments(
      (updated) => {
        setInProgressAppointments(updated);
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

  // Merge appointments
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

  // Handlers
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

  // ── Status badge (consistent with Home) ───────────────────────────────
  const renderStatusBadge = (item: AppointmentWithId) => {
    if (item.status === 'InProgress') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeProgress]}>
          <ActivityIndicator size="small" color={Colors.statusProgress} />
        </View>
      );
    }
    if (item.status === 'Error') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeError]}>
          <Ionicons name="alert-circle" size={16} color={Colors.statusError} />
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, styles.statusBadgeReady]}>
        <Text style={styles.statusBadgeText}>READY</Text>
      </View>
    );
  };

  // Render helpers
  const renderItem = ({ item }: { item: AppointmentWithId }) => (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => handleAppointmentClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {getAppointmentTitle(item)}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {getAppointmentSubtitle(item)}
        </Text>
      </View>
      {renderStatusBadge(item)}
    </TouchableOpacity>
  );

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

  // Main render
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
            <Ionicons name="add" size={18} color={Colors.primaryForeground} />
            <Text style={styles.newButtonText}>
              {isStarting ? 'Starting...' : 'New'}
            </Text>
          </TouchableOpacity>

          {/* Dropdown */}
          {showDropdown && (
            <>
              <TouchableOpacity
                style={styles.dropdownOverlay}
                onPress={() => setShowDropdown(false)}
                activeOpacity={1}
              />
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleLiveNotes}
                >
                  <Ionicons name="mic" size={20} color={Colors.primary} />
                  <Text style={styles.dropdownText}>Live</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={handleUploadUnderstand}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color={Colors.accent4} />
                  <Text style={styles.dropdownText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      } />

      <GuestDisclaimer />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={allAppointments}
          keyExtractor={(item) => item.appointmentId}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            isDesktop && styles.listContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
  },

  // New button
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
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
  dropdownOverlay: {
    position: 'absolute',
    top: -100,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 25,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 230,
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
    elevation: 8,
    zIndex: 30,
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  dropdownText: {
    fontSize: 15,
    color: Colors.foreground,
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
    color: Colors.mutedForeground,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 10,
  },
  listContentDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 28,
    paddingTop: 24,
  },

  // Appointment card (consistent with Home visitCard)
  appointmentCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },

  // Status badges (consistent with Home)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  statusBadgeReady: {
    backgroundColor: Colors.statusReadyBg,
  },
  statusBadgeProgress: {
    backgroundColor: Colors.statusProgressBg,
  },
  statusBadgeError: {
    backgroundColor: Colors.statusErrorBg,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.statusReady,
    letterSpacing: 0.5,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.mutedForeground,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray[400],
    textAlign: 'center',
  },
});
