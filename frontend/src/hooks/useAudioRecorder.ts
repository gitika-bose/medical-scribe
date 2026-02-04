import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (onChunkReady: (chunk: Blob) => void) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const allChunksRef = useRef<Blob[]>([]); // Keep all chunks for full recording
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onChunkReadyRef = useRef<((chunk: Blob) => void) | null>(null);

  const startRecording = useCallback(async (onChunkReady: (chunk: Blob) => void) => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      streamRef.current = stream;
      onChunkReadyRef.current = onChunkReady;

      // Start the first 30-second recording
      startNewRecordingSegment();
      setIsRecording(true);

      // Every 30 seconds, stop current recorder and start a new one
      chunkIntervalRef.current = setInterval(() => {
        stopAndRestartRecording();
      }, 30000); // 30 seconds

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording error:', err);
      throw err;
    }
  }, []);

  const startNewRecordingSegment = useCallback(() => {
    if (!streamRef.current) return;

    // Create a new MediaRecorder for this 30-second segment
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'audio/webm;codecs=opus',
    });

    const currentChunks: Blob[] = [];

    // Collect audio data for this segment
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        currentChunks.push(event.data);
        allChunksRef.current.push(event.data); // Also keep for full recording
      }
    };

    // When this segment stops, send it as a chunk
    mediaRecorder.onstop = async () => {
      if (currentChunks.length > 0) {
        const chunk = new Blob(currentChunks, { type: 'audio/webm' });
        const chunkSizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
        console.log(`[AudioRecorder] Segment complete: ${chunkSizeMB} MB`);
        
        // Send chunk
        if (onChunkReadyRef.current) {
          try {
            await onChunkReadyRef.current(chunk);
            console.log(`[AudioRecorder] Chunk sent successfully`);
          } catch (err) {
            console.error(`[AudioRecorder] Failed to send chunk:`, err);
          }
        }
      }
    };

    // Start recording (no timeslice - record continuously until stopped)
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    console.log(`[AudioRecorder] Started new 30-second recording segment`);
  }, []);

  const stopAndRestartRecording = useCallback(() => {
    const currentRecorder = mediaRecorderRef.current;
    
    if (currentRecorder && currentRecorder.state === 'recording') {
      console.log('[AudioRecorder] Stopping current segment to restart...');
      // Stop current recorder (this will trigger onstop and send the chunk)
      currentRecorder.stop();
      
      // Start a new recording segment immediately
      // Use setTimeout to ensure the stop event completes first
      setTimeout(() => {
        if (streamRef.current) {
          console.log('[AudioRecorder] Restarting new segment...');
          startNewRecordingSegment();
        }
      }, 100);
    }
  }, [startNewRecordingSegment]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Clear interval
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsRecording(false);
        
        // Return full recording if available
        if (allChunksRef.current.length > 0) {
          const fullBlob = new Blob(allChunksRef.current, { type: 'audio/webm' });
          allChunksRef.current = [];
          resolve(fullBlob);
        } else {
          resolve(null);
        }
        return;
      }

      mediaRecorder.onstop = () => {
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Create full recording blob from all chunks
        const fullBlob = allChunksRef.current.length > 0 
          ? new Blob(allChunksRef.current, { type: 'audio/webm' })
          : null;
        
        // Reset state
        setIsRecording(false);
        mediaRecorderRef.current = null;
        allChunksRef.current = [];
        onChunkReadyRef.current = null;
        
        resolve(fullBlob);
      };

      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
  };
}
