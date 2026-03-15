import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { store } from '@/store';
import {
  startAppointment,
  uploadAudioChunk,
  generateQuestions,
  finalizeAppointment,
} from '@/api/appointments';
import { analyticsEvents } from '@/api/analytics';
import { AlertModal } from '@/components/shared/AlertModal';
import { GuestDisclaimer } from '@/components/shared/GuestDisclaimer';
import { QuestionsModal } from '@/components/pages/home/QuestionsModal';
import { Colors } from '@/constants/Colors';

export default function NotetakerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isPhone, isDesktop } = useResponsiveLayout();

  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [firstChunkUploaded, setFirstChunkUploaded] = useState(false);

  // Show expanded provider info modal
  const [showProviderInfoModal, setShowProviderInfoModal] = useState(false);

  // End appointment dialog
  const [showEndDialog, setShowEndDialog] = useState(false);

  const { isRecording, startRecording, stopRecording, flushChunk, error: recordingError } =
    useAudioRecorder();

  const autoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [error]);

  // Duration timer & 30-min auto-timeout
  useEffect(() => {
    if (isRecordingActive && isRecording) {
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      autoTimeoutRef.current = setTimeout(() => {
        console.log('Auto-timeout: Stopping recording after 30 minutes');
        handleStopRecording();
      }, 1_800_000);
    } else {
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
        autoTimeoutRef.current = null;
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (autoTimeoutRef.current) clearTimeout(autoTimeoutRef.current);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [isRecordingActive, isRecording]);

  // Handlers
  const handleStartNotetaking = async () => {
    try {
      setError(null);

      const { appointmentId: newAppointmentId } = await startAppointment();

      sessionIdRef.current = newAppointmentId;
      console.log(`[Session] Starting notetaker with session_id=${newAppointmentId}`);
      analyticsEvents.startRecording(newAppointmentId);
      store.startRecording(newAppointmentId);

      await startRecording(async (chunkUri: string) => {
        try {
          console.log('Uploading audio chunk...');
          await uploadAudioChunk(newAppointmentId, chunkUri, sessionIdRef.current ?? undefined);
          console.log('Audio chunk uploaded successfully');
          setFirstChunkUploaded(true);
        } catch (err) {
          console.error('Failed to upload audio chunk:', err);
          setError('Failed to upload audio. Recording continues...');
        }
      });

      setFirstChunkUploaded(false);
      setIsRecordingActive(true);
    } catch (err) {
      console.error('Failed to start appointment:', err);
      setError('Failed to start appointment. Please try again.');
    }
  };

  const handleGenerateQuestions = async () => {
    const appointmentId = store.getCurrentRecordingId();
    if (!appointmentId) {
      setError('No active appointment');
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      setError(null);

      if (!firstChunkUploaded) {
        console.log('[GenerateQuestions] No chunk uploaded yet — flushing current segment...');
        await flushChunk();
      }

      analyticsEvents.generateQuestions(appointmentId);
      const { questions: generatedQuestions } = await generateQuestions(appointmentId, sessionIdRef.current ?? undefined);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        setError('No questions available.');
        setQuestions(null);
      } else {
        setQuestions(generatedQuestions);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to generate questions:', message);

      if (message.toLowerCase().includes('no transcript')) {
        setError('No questions available.');
      } else if (message.toLowerCase().includes('unavailable')) {
        setError('Service is currently unavailable. Please try again later.');
      } else {
        setError('No questions available');
      }
      setQuestions(null);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleEndClick = () => {
    setShowEndDialog(true);
  };

  const handleStopRecording = async () => {
    const appointmentId = store.getCurrentRecordingId();

    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setShowEndDialog(false);

      if (!appointmentId) throw new Error('No active appointment');

      const lastChunkUri = await stopRecording();

      store.setLastCompletedAppointmentId(appointmentId);
      store.endRecording();

      setIsRecordingActive(false);
      setQuestions(null);
      setFirstChunkUploaded(false);
      setIsProcessing(false);

      const currentSessionId = sessionIdRef.current;
      sessionIdRef.current = null;

      finalizeAppointment(appointmentId, lastChunkUri).catch((err) => {
        console.error('Background finalization error:', err);
      });

      router.push('/appointment-metadata' as any);
    } catch (err) {
      console.error('Failed to stop recording:', err);

      if (appointmentId) {
        store.setLastCompletedAppointmentId(appointmentId);
      }
      store.endRecording();

      setError('Failed to save recording. Please try again.');
      setIsRecordingActive(false);
      setFirstChunkUploaded(false);
      setIsProcessing(false);
      setShowEndDialog(false);

      router.push('/appointment-metadata' as any);
    }
  };

  const handleCancelEnd = () => {
    setShowEndDialog(false);
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Render
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {!isRecordingActive && (
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, isPhone && styles.headerTitlePhone]}>Medical Notetaker</Text>
        <View style={{ width: isRecordingActive ? 0 : 38 }} />
      </View>

      <GuestDisclaimer />

      {/* Error banner */}
      {(recordingError || error) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{recordingError || error}</Text>
        </View>
      )}

      {/* Recording active view */}
      {isRecordingActive ? (
        <View style={[styles.recordingView, isDesktop && styles.recordingViewDesktop]}>
          <View style={styles.recordSection}>
            <View style={[styles.recordButton, isRecording ? styles.recordButtonActive : styles.recordButtonPaused]}>
              {isRecording && <View style={styles.pulseRing} />}
              <Ionicons name="mic" size={48} color={isRecording ? Colors.red[600] : Colors.gray[400]} />
            </View>
            {isRecording && (
              <View style={styles.recordingBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingBadgeText}>Recording {formatDuration(recordingDuration)}</Text>
              </View>
            )}
            <Text style={styles.statusText}>
              {isRecording ? 'Listening and taking notes...' : ''}
            </Text>
          </View>
          <View style={[styles.controls, isDesktop && styles.controlsDesktop]}>
            <TouchableOpacity
              onPress={handleGenerateQuestions}
              disabled={isGeneratingQuestions || questions !== null}
              style={[
                styles.controlButton,
                questions !== null ? styles.controlButtonDone : styles.controlButtonPrimary,
                (isGeneratingQuestions || questions !== null) && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.controlButtonText}>
                {isGeneratingQuestions
                  ? 'Generating...'
                  : questions !== null
                  ? 'Questions Generated'
                  : 'Generate Questions'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEndClick}
              disabled={isProcessing}
              style={[styles.controlButton, styles.controlButtonEnd]}
            >
              <Text style={styles.controlButtonText}>
                {isProcessing ? 'Ending...' : 'End Appointment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── Inform Your Provider screen ── */
        <ScrollView
          contentContainerStyle={[
            styles.informScrollContent,
            isDesktop && styles.informScrollContentDesktop,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.informSection, isDesktop && styles.informSectionDesktop]}>

            {/* Icon */}
            <View style={styles.informIconContainer}>
              <Ionicons name="ear-outline" size={isPhone ? 40 : 48} color={Colors.primary} />
            </View>

            {/* Title */}
            <Text style={[styles.informTitle, isPhone && styles.informTitlePhone]}>
              Inform Your Provider
            </Text>

            {/* Short description — for the patient to read/share */}
            <View style={[styles.quoteBox, isPhone && styles.quoteBoxPhone]}>
              {/* Top-right L-corner bracket */}
              <View style={styles.cornerTopRight} />
              {/* Bottom-left L-corner bracket */}
              <View style={styles.cornerBottomLeft} />
              {/* Opening quote mark — top left */}
              <Text style={[styles.quoteMark, isPhone && styles.quoteMarkPhone]}>{'\u201C'}</Text>
              {/* Body text */}
              <Text style={[styles.informBody, isPhone && styles.informBodyPhone, styles.informBodyQuote]}>
                I am using a medical note taker. It listens in real time to take notes but no audio recordings or transcripts are stored.
              </Text>
              {/* Closing quote mark — bottom right */}
              <Text style={[styles.quoteMarkClose, isPhone && styles.quoteMarkPhone]}>{'\u201D'}</Text>
            </View>

            {/* Hyperlink to expanded provider info */}
            <TouchableOpacity
              style={styles.providerLinkRow}
              onPress={() => setShowProviderInfoModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.providerLinkText, , isPhone && styles.providerLinkTextPhone]}>
                Or,{' '}
                <Text style={styles.providerLinkUnderline}>show this to your provider</Text>
              </Text>
            </TouchableOpacity>

            {/* Start Notetaking button */}
            <TouchableOpacity
              style={[styles.startButton, isPhone && styles.startButtonPhone]}
              onPress={handleStartNotetaking}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={isPhone ? 18 : 22} color="#fff" />
              <Text style={[styles.startButtonText, isPhone && styles.startButtonTextPhone]}>
                Start Notetaking
              </Text>
            </TouchableOpacity>

            {/* No button — soft/outlined, not alarming */}
            <TouchableOpacity
              style={[styles.noButton, isPhone && styles.noButtonPhone]}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Text style={[styles.noButtonText, isPhone && styles.noButtonTextPhone]}>
                No, go back
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      )}

      {/* ── Provider Info Modal ── */}
      <Modal
        visible={showProviderInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProviderInfoModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowProviderInfoModal(false)}
        >
          <Pressable style={styles.modalContainer} onPress={() => {}}>
            <Text style={styles.modalTitle}>About This Tool</Text>
            <Text style={styles.modalBody}>
              This medical note taker helps the patient follow their visit by listening in real time, taking notes, suggesting helpful questions, and generating a visit summary.
            </Text>
            <Text style={styles.modalBody}>
              No appointment audio or verbatim transcript is stored, so it cannot provide playback or exact quotes of what was said during the visit.
            </Text>
            <TouchableOpacity
              style={styles.modalOkButton}
              onPress={() => setShowProviderInfoModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOkButtonText}>OK</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* End appointment dialog */}
      <AlertModal
        visible={showEndDialog}
        title="Stop Notetaking?"
        description="Are you sure you want to stop notetaking? This will end the appointment session."
        confirmLabel="Yes, Stop Notetaking"
        cancelLabel="Cancel"
        onConfirm={handleStopRecording}
        onCancel={handleCancelEnd}
      />

      {questions && (
        <QuestionsModal visible={true} questions={questions} onClose={() => setQuestions(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.lightBackground },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: { padding: 8, borderRadius: 999 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  headerTitlePhone: { fontSize: 16 },

  // Error
  errorBanner: {
    alignSelf: 'center', marginHorizontal: 24, marginTop: 12,
    padding: 14, backgroundColor: Colors.red[50],
    borderWidth: 1, borderColor: Colors.red[300], borderRadius: 12, zIndex: 10,
  },
  errorText: { fontSize: 14, color: Colors.red[700] },

  // ── Inform Your Provider screen ───────────────────────────────────────
  informScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 48,
  },
  informScrollContentDesktop: {
    paddingHorizontal: 48,
  },
  informSection: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  informSectionDesktop: {
    maxWidth: 480,
  },
  informIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  informTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 14,
    textAlign: 'center',
  },
  informTitlePhone: {
    fontSize: 22,
    marginBottom: 12,
  },
  informBody: {
    fontSize: 20,
    color: Colors.mutedForeground,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 18,
  },
  informBodyPhone: {
    fontSize: 16,
    lineHeight: 21,
    marginBottom: 14,
  },

  // ── Quote / corner-bracket box ────────────────────────────────────────
  quoteBox: {
    width: '100%',
    backgroundColor: Colors.primaryForeground,
    borderRadius: 6,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 22,
    marginBottom: 20,
    // no full border — corners are drawn separately
  },
  quoteBoxPhone: {
    paddingHorizontal: 16,
    //paddingBottom: 10,
    marginBottom: 16,
  },
  // Top-right L-corner: border on top + right sides
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 38,
    height: 38,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: Colors.primary,
    borderTopRightRadius: 6,
    opacity: 0.75,
  },
  // Bottom-left L-corner: border on bottom + left sides
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 38,
    height: 38,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 6,
    opacity: 0.75,
  },
  quoteMark: {
    fontSize: 48,
    lineHeight: 50,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: -6,
    opacity: 0.75,
    textAlign: 'left',
  },
  quoteMarkPhone: {
    fontSize: 36,
    lineHeight: 38,
  },
  quoteMarkClose: {
    fontSize: 48,
    lineHeight: 50,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: -6,
    marginBottom: -8,
    opacity: 0.75,
    textAlign: 'right',
  },
  informBodyQuote: {
    marginBottom: 0,
    textAlign: 'left',
  },

  providerLinkRow: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  providerLinkText: {
    fontSize: 18,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  providerLinkUnderline: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  providerLinkTextPhone: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Start button
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 14,
  },
  startButtonPhone: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  startButtonTextPhone: {
    fontSize: 15,
  },

  // No / go back button — soft, white background
  noButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noButtonPhone: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  noButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.mutedForeground,
  },
  noButtonTextPhone: {
    fontSize: 14,
  },

  // ── Provider Info Modal ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 440,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.foreground,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 17,
    color: Colors.mutedForeground,
    lineHeight: 26,
    marginBottom: 14,
  },
  modalOkButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalOkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Recording active view
  recordingView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  recordingViewDesktop: { paddingHorizontal: 48 },
  recordSection: { alignItems: 'center', marginBottom: 48 },
  recordButton: {
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    width: 96, height: 96,
  },
  recordButtonActive: { backgroundColor: Colors.red[50] },
  recordButtonPaused: { backgroundColor: Colors.gray[100] },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.red[300],
    opacity: 0.5,
  },
  recordingBadge: {
    marginTop: 16, backgroundColor: Colors.red[600],
    paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  recordingDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff',
  },
  recordingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusText: { marginTop: 12, fontSize: 15, color: Colors.mutedForeground, minHeight: 20 },

  // Controls
  controls: { width: '100%', maxWidth: 400, gap: 12 },
  controlsDesktop: { maxWidth: 480 },
  controlButton: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  controlButtonPrimary: { backgroundColor: Colors.primary },
  controlButtonDone: { backgroundColor: Colors.green[500] },
  controlButtonEnd: { backgroundColor: Colors.warmDark },
  controlButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
