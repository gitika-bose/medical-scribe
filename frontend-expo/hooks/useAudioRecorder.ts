import { useState, useRef, useCallback } from 'react';
import {
  AudioModule,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import type { AudioRecorder, RecordingOptions } from 'expo-audio';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (onChunkReady: (chunkUri: string) => void) => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
}

const CHUNK_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Uses expo-audio's string-based enums for output format and encoder.
 */
const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 128000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    audioQuality: AudioQuality.HIGH,
    outputFormat: IOSOutputFormat.MPEG4AAC,
  },
  web: {
    mimeType: 'audio/webm;codecs=opus',
    bitsPerSecond: 128000,
  },
};

/**
 * Audio recorder hook using expo-audio.
 *
 * Mirrors the web version but uses native recording.
 * - Produces 30-second audio chunk files that are uploaded via `onChunkReady`.
 * - `stopRecording` returns the URI of the last chunk (or null).
 *   Full-audio concatenation is left to the server which already receives all chunks.
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onChunkReadyRef = useRef<((uri: string) => void) | null>(null);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  const createAndStartRecording = useCallback(async (): Promise<AudioRecorder> => {
    const recorder = new AudioModule.AudioRecorder(RECORDING_OPTIONS);
    await recorder.prepareToRecordAsync();
    recorder.record();
    return recorder;
  }, []);

  /**
   * Stop the current recording segment, fire the chunk callback, and
   * optionally start a new segment.
   */
  const rotateSegment = useCallback(async (startNew: boolean): Promise<string | null> => {
    const currentRecorder = recorderRef.current;
    if (!currentRecorder) return null;

    try {
      await currentRecorder.stop();
      const uri = currentRecorder.getStatus().url;
      recorderRef.current = null;

      if (uri && onChunkReadyRef.current) {
        console.log(`[AudioRecorder] Segment complete: ${uri}`);
        try {
          onChunkReadyRef.current(uri);
        } catch (err) {
          console.error('[AudioRecorder] Failed to deliver chunk:', err);
        }
      }

      if (startNew) {
        recorderRef.current = await createAndStartRecording();
        console.log('[AudioRecorder] Started new recording segment');
      }

      return uri;
    } catch (err) {
      console.error('[AudioRecorder] Error rotating segment:', err);
      return null;
    }
  }, [createAndStartRecording]);

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  const startRecording = useCallback(
    async (onChunkReady: (chunkUri: string) => void) => {
      try {
        setError(null);

        // Request permissions
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          throw new Error('Microphone permission not granted');
        }

        // Configure audio session
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        onChunkReadyRef.current = onChunkReady;

        // Start the first segment
        recorderRef.current = await createAndStartRecording();
        setIsRecording(true);
        console.log('[AudioRecorder] Recording started');

        // Rotate every CHUNK_INTERVAL_MS
        chunkIntervalRef.current = setInterval(() => {
          rotateSegment(true);
        }, CHUNK_INTERVAL_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start recording';
        setError(msg);
        console.error('Recording error:', err);
        throw err;
      }
    },
    [createAndStartRecording, rotateSegment],
  );

  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Clear the chunk interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    // Stop and get last chunk URI
    const lastUri = await rotateSegment(false);

    // Reset audio mode
    try {
      await setAudioModeAsync({
        allowsRecording: false,
      });
    } catch (_) {}

    setIsRecording(false);
    onChunkReadyRef.current = null;
    console.log('[AudioRecorder] Recording stopped');

    return lastUri;
  }, [rotateSegment]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
}
