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
import { formatAppointmentDate, formatAppointmentDateLong } from '@/utils/formatDate';
import { DeleteAppointmentButton } from '@/components/shared/DeleteAppointmentButton';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { Colors } from '@/constants/Colors';
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
        <ActivityIndicator size="large" color={Colors.blue[600]} />
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Error status (processing failed)
  // ---------------------------------------------------------------------------
  if (error || !appointment || appointment.status === 'Error') {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getAppointmentTitle()}
            </Text>
            <Text style={styles.headerDate}>
              {(appointment && formatAppointmentDate(appointment.appointmentDate)) || (formatAppointmentDateLong(new Date().toString()))}
            </Text>
          </View>
        </View>

        {/* Guest disclaimer banner */}
        <GuestDisclaimer />

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Not found message with reason */}
          <View style={styles.notFoundInline}>
            <Ionicons name="alert-circle" size={32} color={Colors.red[600]} />
            <Text style={styles.notFoundTitle}>No appointment details found</Text>
          </View>

          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>
              {(appointment as any).error ||
                'We encountered an error while processing this appointment.'}
            </Text>
          </View>

          {/* Appointment metadata */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsHeading}>Appointment Info</Text>
            <View style={styles.detailsList}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>
                  {(appointment && formatAppointmentDateLong(appointment.appointmentDate)) || (formatAppointmentDateLong(new Date().toString()))}
                </Text>
              </View>
              {appointment && appointment.title && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title</Text>
                  <Text style={styles.detailValue}>{appointment.title}</Text>
                </View>
              )}
              {appointment && appointment.doctor && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Doctor</Text>
                  <Text style={styles.detailValue}>{appointment.doctor}</Text>
                </View>
              )}
              {appointment && appointment.location && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{appointment.location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons – side by side */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.feedbackButton}
              onPress={() => {
                console.log('Feedback button clicked for appointment:', id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbox-outline" size={18} color={Colors.primaryForeground} />
              <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
            </TouchableOpacity>
            <DeleteAppointmentButton appointmentId={id!} onDeleteError={setError} style={{ flex: 1 }} />
          </View>
        </ScrollView>
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
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
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
          <ActivityIndicator size="large" color={Colors.blue[600]} />
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
  const hasSummaryContent =
    appointment.processedSummary &&
    (appointment.processedSummary.summary ||
      appointment.processedSummary.reason_for_visit ||
      appointment.processedSummary.diagnosis ||
      appointment.processedSummary.todos ||
      appointment.processedSummary.follow_up ||
      appointment.processedSummary.learnings);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
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

      {/* Guest disclaimer banner */}
      <GuestDisclaimer />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasSummaryContent ? (
          <>
            {appointment.processedSummary!.summary && (
              <SummarySection summary={appointment.processedSummary!.summary} />
            )}

            {appointment.processedSummary!.reason_for_visit && (
              <ReasonForVisitSection
                reasonForVisit={appointment.processedSummary!.reason_for_visit}
              />
            )}

            {appointment.processedSummary!.diagnosis && (
              <DiagnosisSection diagnosis={appointment.processedSummary!.diagnosis} />
            )}

            {appointment.processedSummary!.todos && (
              <TodosSection todos={appointment.processedSummary!.todos} />
            )}

            {appointment.processedSummary!.follow_up && (
              <FollowUpSection followUp={appointment.processedSummary!.follow_up} />
            )}

            {appointment.processedSummary!.learnings && (
              <LearningsSection learnings={appointment.processedSummary!.learnings} />
            )}
          </>
        ) : (
          <>
            <View style={styles.notFoundInline}>
              <Ionicons name="document-text-outline" size={32} color={Colors.gray[400]} />
              <Text style={styles.notFoundTitle}>No appointment details found</Text>
            </View>
            <View style={styles.reasonCard}>
              <Text style={styles.reasonLabel}>Reason</Text>
              <Text style={styles.reasonText}>
                No summary data is available for this appointment.
              </Text>
            </View>
          </>
        )}

        <DeleteAppointmentButton appointmentId={id!} onDeleteError={setError} style={{ flex: 1, width: 'auto' }}/>
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
    backgroundColor: Colors.gray[50],
  },

  // Centered states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.gray[500],
    marginTop: 8,
  },

  // Not-found state
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  notFoundInline: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.gray[700],
    textAlign: 'center',
  },
  reasonCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[500],
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 15,
    color: Colors.gray[700],
    lineHeight: 22,
  },
  backLink: {
    marginTop: 8,
  },
  backLinkText: {
    fontSize: 15,
    color: Colors.blue[600],
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
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
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
    color: Colors.primary,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.gray[500],
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
    color: Colors.primary,
  },
  processingSubtitle: {
    fontSize: 15,
    color: Colors.gray[500],
    textAlign: 'center',
  },

  // Details card (for error status)
  detailsCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsHeading: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {},
  detailLabel: {
    fontSize: 13,
    color: Colors.gray[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: Colors.primary,
  },

  // Action row – side by side buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Feedback button
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.blue[600],
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  feedbackButtonText: {
    color: Colors.primaryForeground,
    fontSize: 15,
    fontWeight: '600',
  },
});
