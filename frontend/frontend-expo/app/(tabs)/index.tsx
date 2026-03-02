import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import {
  fetchAppointments,
  isV13Summary,
  type AppointmentWithId,
  type ProcessedSummaryV13,
  type ProcessedSummaryV12,
} from '@/api/appointments';
import { formatAppointmentDate } from '@/utils/formatDate';
import { Colors } from '@/constants/Colors';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTodayHeader(): { weekday: string; date: string } {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = now.getDate();
  return { weekday, date: `${weekday}, ${month} ${day}` };
}

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

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const { isPhone, isDesktop } = useResponsiveLayout();

  const [recentVisits, setRecentVisits] = useState<AppointmentWithId[]>([]);
  const [actionTodos, setActionTodos] = useState<Array<{ title: string; importance: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { date: todayDate } = getTodayHeader();

  // ── Fetch recent appointments + care plan data ────────────────────────
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const allAppointments = await fetchAppointments();

        // Recent visits: last 3 appointments
        setRecentVisits(allAppointments.slice(0, 3));

        // Care plan: action_todo from the most recent completed appointment
        const completedWithSummary = allAppointments.find(
          (a) =>
            a.status === 'Completed' &&
            a.processedSummary &&
            isV13Summary(a.processedSummary),
        );
        if (completedWithSummary) {
          const summary = completedWithSummary.processedSummary as ProcessedSummaryV13;
          setActionTodos(summary.action_todo || []);
        } else {
          // Fallback: check for v1.2 todos
          const completedV12 = allAppointments.find(
            (a) =>
              a.status === 'Completed' &&
              a.processedSummary &&
              !isV13Summary(a.processedSummary),
          );
          if (completedV12) {
            const summary = completedV12.processedSummary as ProcessedSummaryV12;
            setActionTodos(
              (summary.todos || []).map((t) => ({
                title: t.title,
                importance: 'low',
              })),
            );
          }
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading]);

  // ── Status badge helper ───────────────────────────────────────────────
  const renderStatusBadge = (appointment: AppointmentWithId) => {
    if (appointment.status === 'InProgress') {
      return (
        <View style={[styles.statusBadge, styles.statusBadgeProgress]}>
          <ActivityIndicator size="small" color={Colors.statusProgress} />
        </View>
      );
    }
    if (appointment.status === 'Error') {
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

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: isDesktop ? 0 : insets.top }]}>
      <GuestDisclaimer />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerContent, isDesktop && styles.innerContentDesktop]}>
          {/* ── Date & Greeting ─────────────────────────────────────────── */}
          <Text style={[styles.dateLabel, isPhone && styles.dateLabelPhone]}>
            {todayDate}
          </Text>
          <Text style={[styles.greeting, isPhone && styles.greetingPhone]}>
            How are you today?
          </Text>

          {/* ── Action Buttons ──────────────────────────────────────────── */}
          <View style={[styles.actionRow, isPhone && styles.actionRowPhone]}>
            {/* Record Visit */}
            <TouchableOpacity
              style={[styles.recordButton, isPhone && styles.recordButtonPhone]}
              onPress={() => router.push('/notetaker' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.recordButtonContent}>
                <Text style={[styles.recordTitle, isPhone && styles.recordTitlePhone]}>
                  Record Visit
                </Text>
                <Text style={[styles.recordSubtitle, isPhone && styles.recordSubtitlePhone]}>
                  Listen & simplify
                </Text>
              </View>
              <View style={styles.recordIcon}>
                <Ionicons name="mic" size={isPhone ? 18 : 22} color={Colors.primary} />
              </View>
            </TouchableOpacity>

            {/* Upload */}
            <TouchableOpacity
              style={[styles.uploadButton, isPhone && styles.uploadButtonPhone]}
              onPress={() => router.push('/explain-my-appointment' as any)}
              activeOpacity={0.85}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={isPhone ? 24 : 28}
                color={Colors.mutedForeground}
              />
              <Text style={[styles.uploadText, isPhone && styles.uploadTextPhone]}>
                Upload
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Recent Visits ───────────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isPhone && styles.sectionTitlePhone]}>
              Recent Visits
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/appointments' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : recentVisits.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={28} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>No visits yet</Text>
            </View>
          ) : (
            <View style={styles.visitsList}>
              {recentVisits.map((appointment) => (
                <TouchableOpacity
                  key={appointment.appointmentId}
                  style={styles.visitCard}
                  onPress={() =>
                    router.push(`/appointment/${appointment.appointmentId}` as any)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.visitCardContent}>
                    <Text style={styles.visitTitle} numberOfLines={1}>
                      {getAppointmentTitle(appointment)}
                    </Text>
                    <Text style={styles.visitSubtitle} numberOfLines={1}>
                      {getAppointmentSubtitle(appointment)}
                    </Text>
                  </View>
                  {renderStatusBadge(appointment)}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Care Plan ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, styles.sectionTitleStandalone, isPhone && styles.sectionTitlePhone]}>
            Care Plan
          </Text>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : actionTodos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={28} color={Colors.gray[400]} />
              <Text style={styles.emptyText}>No action items yet</Text>
            </View>
          ) : (
            <View style={styles.carePlanList}>
              {actionTodos.map((todo, index) => (
                <View key={index} style={styles.carePlanCard}>
                  <Text style={styles.carePlanTitle}>{todo.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  scrollContentDesktop: {
    paddingHorizontal: 40,
    paddingTop: 36,
    alignItems: 'center',
  },
  innerContent: {
    width: '100%',
  },
  innerContentDesktop: {
    maxWidth: 720,
    width: '100%',
  },

  // ── Date & Greeting ────────────────────────────────────────────────────
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mutedForeground,
    letterSpacing: 1,
    marginBottom: 6,
  },
  dateLabelPhone: {
    fontSize: 12,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 28,
  },
  greetingPhone: {
    fontSize: 24,
    marginBottom: 20,
  },

  // ── Action Buttons ─────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  actionRowPhone: {
    gap: 10,
    marginBottom: 24,
  },

  // Record Visit button
  recordButton: {
    flex: 3,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  recordButtonPhone: {
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
  },
  recordButtonContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  recordTitlePhone: {
    fontSize: 17,
  },
  recordSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  recordSubtitlePhone: {
    fontSize: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Upload button
  uploadButton: {
    flex: 2,
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  uploadButtonPhone: {
    borderRadius: 16,
    padding: 14,
    minHeight: 80,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
    marginTop: 8,
  },
  uploadTextPhone: {
    fontSize: 13,
    marginTop: 6,
  },

  // ── Section Headers ────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  sectionTitlePhone: {
    fontSize: 17,
  },
  sectionTitleStandalone: {
    marginBottom: 14,
    marginTop: 8,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },

  // ── Visits List ────────────────────────────────────────────────────────
  visitsList: {
    gap: 10,
    marginBottom: 28,
  },
  visitCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visitCardContent: {
    flex: 1,
  },
  visitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 3,
  },
  visitSubtitle: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },

  // ── Status Badges ──────────────────────────────────────────────────────
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

  // ── Care Plan ──────────────────────────────────────────────────────────
  carePlanList: {
    gap: 10,
    marginBottom: 16,
  },
  carePlanCard: {
    backgroundColor: Colors.carePlanBackground,
    borderRadius: 14,
    padding: 16,
  },
  carePlanTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
  },

  // ── Empty / Loading ────────────────────────────────────────────────────
  loadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
});
