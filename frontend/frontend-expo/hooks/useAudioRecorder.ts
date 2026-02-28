import { useState, useRef, useCallback } from 'react';
import {
  useAudioRecorder as useExpoAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (onChunkReady: (chunkUri: string) => void) => Promise<void>;
  stopRecording: () => Promise<string | null>;
  /** Force-flush the current recording segment: uploads it immediately and starts a new one. */
  flushChunk: () => Promise<string | null>;
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

  // Use expo-audio's hook to properly create the recorder (handles both native & web)
  const recorder = useExpoAudioRecorder(RECORDING_OPTIONS);

  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onChunkReadyRef = useRef<((uri: string) => void | Promise<void>) | null>(null);
  const isRecordingRef = useRef(false);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Stop the current recording segment, fire the chunk callback, and
   * optionally start a new segment by re-preparing the same recorder.
   */
  const rotateSegment = useCallback(
    async (startNew: boolean): Promise<string | null> => {
      if (!isRecordingRef.current) return null;

      try {
        await recorder.stop();
        const uri = recorder.getStatus().url;

        if (uri && onChunkReadyRef.current) {
          console.log(`[AudioRecorder] Segment complete: ${uri}`);
          try {
            await onChunkReadyRef.current(uri);
          } catch (err) {
            console.error('[AudioRecorder] Failed to deliver chunk:', err);
          }
        }

        if (startNew) {
          await recorder.prepareToRecordAsync();
          recorder.record();
          console.log('[AudioRecorder] Started new recording segment');
        }

        return uri;
      } catch (err) {
        console.error('[AudioRecorder] Error rotating segment:', err);
        return null;
      }
    },
    [recorder],
  );

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

        // Prepare and start the recorder
        await recorder.prepareToRecordAsync();
        recorder.record();
        isRecordingRef.current = true;
        setIsRecording(true);
        console.log('[AudioRecorder] Recording started');

        // Rotate every CHUNK_INTERVAL_MS
        chunkIntervalRef.current = setInterval(() => {
          rotateSegment(true);
        }, CHUNK_INTERVAL_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start note taking';
        setError(msg);
        console.error('Recording error:', err);
        throw err;
      }
    },
    [recorder, rotateSegment],
  );

  /**
   * Force-flush the current recording segment immediately.
   * Uploads it via the onChunkReady callback, starts a new segment,
   * and resets the 30-second chunk interval timer.
   */
  const flushChunk = useCallback(async (): Promise<string | null> => {
    if (!isRecordingRef.current) return null;

    // Reset the periodic interval so the next auto-rotate is a full 30s from now
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
    }

    const uri = await rotateSegment(true);

    // Restart the interval
    chunkIntervalRef.current = setInterval(() => {
      rotateSegment(true);
    }, CHUNK_INTERVAL_MS);

    return uri;
  }, [rotateSegment]);

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

    isRecordingRef.current = false;
    setIsRecording(false);
    onChunkReadyRef.current = null;
    console.log('[AudioRecorder] Recording stopped');

    return lastUri;
  }, [rotateSegment]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    flushChunk,
    error,
  };
}
