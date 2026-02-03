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
  const chunksRef = useRef<Blob[]>([]);
  const allChunksRef = useRef<Blob[]>([]); // Keep all chunks for full recording
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      chunksRef.current = [];

      // Collect audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          allChunksRef.current.push(event.data); // Also keep for full recording
        }
      };

      // Start recording with 1-second chunks
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Every 30 seconds, create a blob from collected chunks and send it
      chunkIntervalRef.current = setInterval(async () => {
        if (chunksRef.current.length > 0) {
          const chunk = new Blob(chunksRef.current, { type: 'audio/webm' });
          const chunkSizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
          console.log(`[AudioRecorder] Creating chunk: ${chunkSizeMB} MB, ${chunksRef.current.length} data pieces`);
          
          // Clear chunks BEFORE sending to avoid race condition
          const chunkToSend = chunk;
          chunksRef.current = [];
          
          // Send chunk (await to ensure it completes)
          try {
            await onChunkReady(chunkToSend);
            console.log(`[AudioRecorder] Chunk sent successfully`);
          } catch (err) {
            console.error(`[AudioRecorder] Failed to send chunk:`, err);
          }
        }
      }, 30000); // 30 seconds (well under 60s limit)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording error:', err);
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Clear interval
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
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
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Create full recording blob from all chunks
        const fullBlob = allChunksRef.current.length > 0 
          ? new Blob(allChunksRef.current, { type: 'audio/webm' })
          : null;
        
        // Reset state
        setIsRecording(false);
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        allChunksRef.current = [];
        
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
