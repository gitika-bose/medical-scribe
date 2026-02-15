import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
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
import { QuestionsModal } from '@/components/pages/home/QuestionsModal';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();

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

      // 30-minute auto-timeout
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
  // Recording handlers
  // ---------------------------------------------------------------------------

  const handleRecordingClick = () => {
    if (!isRecordingActive) {
      setShowConsentDialog(true);
    }
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

      // If no chunk has been uploaded yet, force-flush the current segment
      // so the backend has a transcript to work with.
      if (!firstChunkUploaded) {
        console.log('[GenerateQuestions] No chunk uploaded yet — flushing current segment...');
        await flushChunk();
        // flushChunk triggers the onChunkReady callback which sets firstChunkUploaded
      }

      analyticsEvents.generateQuestions(appointmentId);
      const { questions: generatedQuestions } = await generateQuestions(appointmentId);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        setError('No questions generated — the conversation may be too short.');
        setQuestions(null);
      } else {
        setQuestions(generatedQuestions);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to generate questions:', message);

      if (message.toLowerCase().includes('no transcript')) {
        setError('Still transcribing audio — please wait a moment and try again.');
      } else if (message.toLowerCase().includes('unavailable')) {
        setError('Service is currently unavailable. Please try again later.');
      } else {
        setError(`Failed to generate questions: ${message}`);
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

      // Stop recording – returns the last chunk URI
      const lastChunkUri = await stopRecording();

      store.setLastCompletedAppointmentId(appointmentId);
      store.endRecording();

      setIsRecordingActive(false);
      setQuestions(null);
      setFirstChunkUploaded(false);
      setIsProcessing(false);

      // Finalize in background (pass last chunk as audio fallback for recording link)
      finalizeAppointment(appointmentId, lastChunkUri).catch((err) => {
        console.error('Background finalization error:', err);
      });

      // Navigate to metadata page
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

      // Still navigate to metadata page
      router.push('/appointment-metadata' as any);
    }
  };

  const handleCancelEnd = () => {
    setShowEndDialog(false);
  };

  const handleSignOut = async () => {
    if (isRecordingActive) return;
    try {
      await signOut();
      router.replace('/login' as any);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Juno</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          disabled={isRecordingActive}
          style={[
            styles.signOutButton,
            isRecordingActive && styles.signOutDisabled,
          ]}
        >
          <Text
            style={[
              styles.signOutText,
              isRecordingActive && styles.signOutTextDisabled,
            ]}
          >
            Sign out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {/* Error Messages */}
        {(recordingError || error) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{recordingError || error}</Text>
          </View>
        )}

        {/* Recording Button */}
        <View style={styles.recordSection}>
          <TouchableOpacity
            onPress={handleRecordingClick}
            disabled={isRecordingActive || isProcessing}
            activeOpacity={0.7}
            style={[
              styles.recordButton,
              isRecordingActive
                ? isRecording
                  ? styles.recordButtonActive
                  : styles.recordButtonPaused
                : styles.recordButtonIdle,
              (isRecordingActive || isProcessing) && { opacity: isRecordingActive ? 1 : 0.5 },
            ]}
          >
            <Ionicons
              name="mic"
              size={isRecordingActive ? 48 : 56}
              color={isRecordingActive ? (isRecording ? '#DC2626' : '#9CA3AF') : '#fff'}
            />
          </TouchableOpacity>

          {/* Recording badge */}
          {isRecordingActive && isRecording && (
            <View style={styles.recordingBadge}>
              <Text style={styles.recordingBadgeText}>
                Recording {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}

          {/* Status text */}
          <View style={styles.statusTextWrapper}>
            {isRecordingActive && isRecording && (
              <Text style={styles.statusText}>Listening and taking notes...</Text>
            )}
          </View>
        </View>

        {/* Controls – visible only when recording */}
        {isRecordingActive && (
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleGenerateQuestions}
              disabled={isGeneratingQuestions || questions !== null}
              style={[
                styles.controlButton,
                questions !== null
                  ? styles.controlButtonDone
                  : styles.controlButtonPrimary,
                (isGeneratingQuestions || questions !== null) && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  styles.controlButtonText,
                  questions !== null && styles.controlButtonDoneText,
                ]}
              >
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
                {isProcessing ? 'Ending...' : 'End'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ---- Modals ---- */}

      {/* Consent Dialog */}
      <AlertModal
        visible={showConsentDialog}
        title="Recording Consent"
        description="Does the doctor agree to recording this appointment?"
        confirmLabel="Yes, Record"
        cancelLabel="No"
        onConfirm={handleConsentApproved}
        onCancel={handleConsentDeclined}
      />

      {/* End Recording Dialog */}
      <AlertModal
        visible={showEndDialog}
        title="Stop Recording?"
        description="Are you sure you want to stop the recording? This will end the appointment session."
        confirmLabel="Yes, Stop Recording"
        cancelLabel="Cancel"
        onConfirm={handleStopRecording}
        onCancel={handleCancelEnd}
      />

      {/* Questions Modal */}
      {questions && (
        <QuestionsModal
          visible={true}
          questions={questions}
          onClose={() => setQuestions(null)}
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
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  signOutDisabled: {
    opacity: 0.4,
  },
  signOutText: {
    fontSize: 14,
    color: '#374151',
  },
  signOutTextDisabled: {
    color: '#9CA3AF',
  },

  // Main
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Error
  errorBanner: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
  },

  // Record button area
  recordSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  recordButton: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  recordButtonIdle: {
    width: 144,
    height: 144,
    backgroundColor: '#B91C1C',
  },
  recordButtonActive: {
    width: 96,
    height: 96,
    backgroundColor: '#FEE2E2',
  },
  recordButtonPaused: {
    width: 96,
    height: 96,
    backgroundColor: '#F3F4F6',
  },

  recordingBadge: {
    marginTop: 12,
    backgroundColor: '#DC2626',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  recordingBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  statusTextWrapper: {
    marginTop: 12,
    minHeight: 20,
  },
  statusText: {
    fontSize: 15,
    color: '#6B7280',
  },

  // Controls
  controls: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  controlButton: {
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  controlButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  controlButtonDone: {
    backgroundColor: '#DCFCE7',
  },
  controlButtonEnd: {
    backgroundColor: '#111827',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  controlButtonDoneText: {
    color: '#15803D',
  },
});
