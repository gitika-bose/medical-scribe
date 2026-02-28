import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
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
  const { width } = useWindowDimensions();
  const isPhone = width < 600;

  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [firstChunkUploaded, setFirstChunkUploaded] = useState(false);

  // Dialogs
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const { isRecording, startRecording, stopRecording, flushChunk, error: recordingError } =
    useAudioRecorder();

  const autoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStartRecording = () => {
    setShowConsentDialog(true);
  };

  const handleConsentApproved = async () => {
    setShowConsentDialog(false);
    try {
      setError(null);

      const { appointmentId: newAppointmentId } = await startAppointment();
      analyticsEvents.startRecording(newAppointmentId);
      store.startRecording(newAppointmentId);

      await startRecording(async (chunkUri: string) => {
        try {
          console.log('Uploading audio chunk...');
          await uploadAudioChunk(newAppointmentId, chunkUri);
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

  const handleConsentDeclined = () => {
    setShowConsentDialog(false);
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
      const { questions: generatedQuestions } = await generateQuestions(appointmentId);

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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* ===== Recording active view ===== */}
      {isRecordingActive ? (
        <View style={styles.recordingView}>
          <View style={styles.recordSection}>
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.recordButton, isRecording ? styles.recordButtonActive : styles.recordButtonPaused]}
            >
              <Ionicons name="mic" size={48} color={isRecording ? Colors.red[600] : Colors.gray[400]} />
            </TouchableOpacity>
            {isRecording && (
              <View style={styles.recordingBadge}>
                <Text style={styles.recordingBadgeText}>Recording {formatDuration(recordingDuration)}</Text>
              </View>
            )}
            <Text style={styles.statusText}>
              {isRecording ? 'Listening and taking notes...' : ''}
            </Text>
          </View>
          <View style={styles.controls}>
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
        /* ===== Start recording view ===== */
        <View style={styles.startView}>
          <View style={styles.startSection}>
            <View style={styles.startIconContainer}>
              <Ionicons name="mic" size={56} color={Colors.primary} />
            </View>
            <Text style={[styles.startTitle, isPhone && styles.startTitlePhone]}>Start Notetaking</Text>
            <Text style={[styles.startDescription, isPhone && styles.startDescriptionPhone]}>
              Juno will listen, take notes, and generate smart questions.
            </Text>
            <TouchableOpacity
              style={[styles.startButton, isPhone && styles.startButtonPhone]}
              onPress={handleStartRecording}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={isPhone ? 18 : 22} color="#fff" />
              <Text style={[styles.startButtonText, isPhone && styles.startButtonTextPhone]}>Start Notetaking</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ---- Modals ---- */}
      <AlertModal
        visible={showConsentDialog}
        title="Notetaking Consent"
        description="Juno will listen to your conversation and take notes. Does the doctor agree to this?"
        confirmLabel="Yes, Start Notetaking"
        cancelLabel="No"
        onConfirm={handleConsentApproved}
        onCancel={handleConsentDeclined}
      />
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

  // Explanation banner
  explanationBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.purple[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.purple[200],
  },
  explanationText: {
    fontSize: 13,
    color: Colors.mutedForeground,
    lineHeight: 19,
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    alignSelf: 'center', marginHorizontal: 24, marginTop: 12,
    padding: 14, backgroundColor: Colors.red[50],
    borderWidth: 1, borderColor: Colors.red[300], borderRadius: 12, zIndex: 10,
  },
  errorText: { fontSize: 14, color: Colors.red[700] },

  // Start view
  startView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  startSection: { alignItems: 'center', maxWidth: 360 },
  startIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.purple[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  startTitle: { fontSize: 24, fontWeight: '700', color: Colors.foreground, marginBottom: 12, textAlign: 'center' },
  startDescription: { fontSize: 15, color: Colors.mutedForeground, lineHeight: 22, textAlign: 'center', marginBottom: 32 },
  startButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 14,
  },
  startButtonText: { fontSize: 17, fontWeight: '600', color: '#fff' },

  // Recording active view
  recordingView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  recordSection: { alignItems: 'center', marginBottom: 48 },
  recordButton: { borderRadius: 999, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  recordButtonActive: { width: 96, height: 96, backgroundColor: Colors.red[50] },
  recordButtonPaused: { width: 96, height: 96, backgroundColor: Colors.gray[100] },
  recordingBadge: {
    marginTop: 12, backgroundColor: Colors.red[600],
    paddingVertical: 4, paddingHorizontal: 14, borderRadius: 999,
  },
  recordingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  statusText: { marginTop: 12, fontSize: 15, color: Colors.gray[500], minHeight: 20 },

  // Controls
  controls: { width: '100%', maxWidth: 400, gap: 12 },
  controlButton: { borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  controlButtonPrimary: { backgroundColor: Colors.primary },
  controlButtonDone: { backgroundColor: Colors.green[500] },
  controlButtonEnd: { backgroundColor: Colors.accent2 },
  controlButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // Phone-specific responsive overrides (width < 600)
  headerTitlePhone: { fontSize: 16 },
  startTitlePhone: { fontSize: 20, marginBottom: 8 },
  startDescriptionPhone: { fontSize: 13, lineHeight: 19, marginBottom: 24 },
  startButtonPhone: { paddingVertical: 14, paddingHorizontal: 24 },
  startButtonTextPhone: { fontSize: 15 },
});
