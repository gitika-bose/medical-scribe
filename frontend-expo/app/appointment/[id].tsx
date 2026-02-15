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
import { getSingleAppointment, type Appointment } from '@/api/appointments';
import { analyticsEvents } from '@/api/analytics';
import { formatAppointmentDate } from '@/utils/formatDate';
import { DeleteAppointmentButton } from '@/components/shared/DeleteAppointmentButton';
import {
  SummarySection,
  ReasonForVisitSection,
  DiagnosisSection,
  TodosSection,
  FollowUpSection,
  LearningsSection,
} from '@/components/pages/appointment-detail';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    const loadAppointment = async () => {
      if (!id) {
        setError('Invalid appointment ID');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getSingleAppointment(id);

        if (data) {
          setAppointment(data);
          analyticsEvents.viewAppointmentDetail(id);
        } else {
          setError('Appointment not found');
        }
      } catch (err) {
        console.error('Failed to load appointment:', err);
        setError(err instanceof Error ? err.message : 'Failed to load appointment');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
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
  // Loading state
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error / not found state
  // ---------------------------------------------------------------------------
  if (error || !appointment) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error || 'Appointment not found'}</Text>
        <TouchableOpacity style={styles.backLink} onPress={navigateBack}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // InProgress state (processing spinner)
  // ---------------------------------------------------------------------------
  if (appointment.status === 'InProgress') {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getAppointmentTitle()}
            </Text>
            <Text style={styles.headerDate}>
              {formatAppointmentDate(appointment.appointmentDate)}
            </Text>
          </View>
        </View>

        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.processingTitle}>Processing Appointment</Text>
          <Text style={styles.processingSubtitle}>
            Please wait while we process your appointment...
          </Text>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Completed state (full details)
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
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
        {appointment.processedSummary ? (
          <>
            {appointment.processedSummary.summary && (
              <SummarySection summary={appointment.processedSummary.summary} />
            )}

            {appointment.processedSummary.reason_for_visit && (
              <ReasonForVisitSection
                reasonForVisit={appointment.processedSummary.reason_for_visit}
              />
            )}

            {appointment.processedSummary.diagnosis && (
              <DiagnosisSection diagnosis={appointment.processedSummary.diagnosis} />
            )}

            {appointment.processedSummary.todos && (
              <TodosSection todos={appointment.processedSummary.todos} />
            )}

            {appointment.processedSummary.follow_up && (
              <FollowUpSection followUp={appointment.processedSummary.follow_up} />
            )}

            {appointment.processedSummary.learnings && (
              <LearningsSection learnings={appointment.processedSummary.learnings} />
            )}
          </>
        ) : (
          <View style={styles.noSummary}>
            <Text style={styles.noSummaryText}>No summary available</Text>
          </View>
        )}

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
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6B7280',
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
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
    color: '#111',
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

  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  processingSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },

  // No summary
  noSummary: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noSummaryText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
