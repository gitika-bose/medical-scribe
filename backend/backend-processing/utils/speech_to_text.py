from google.cloud import speech
import io
import subprocess
import threading

class SpeechToTextService:
    """Service for converting audio chunks to text using Google Cloud Speech-to-Text"""
    
    def __init__(self):
        self.client = speech.SpeechClient()
    
    def _stream_decode_to_pcm(self, audio_content: bytes, chunk_size: int = 4800):
        """
        Stream decode audio to PCM using ffmpeg pipe, yielding small chunks as they're decoded.
        This avoids buffering the entire decoded audio in memory.
        
        Args:
            audio_content: Audio file content in any format (webm, mp3, wav, etc.)
            chunk_size: Size of PCM chunks to yield (default 4800 bytes = ~150ms at 16kHz)
            
        Yields:
            PCM audio chunks (mono, 16-bit, 16 kHz)
        """
        try:
            # Use ffmpeg to decode audio to raw PCM via pipe
            # -i pipe:0 = read from stdin
            # -f s16le = signed 16-bit little-endian PCM
            # -acodec pcm_s16le = PCM codec
            # -ar 16000 = 16 kHz sample rate
            # -ac 1 = mono (1 channel)
            # pipe:1 = write to stdout
            process = subprocess.Popen(
                [
                    'ffmpeg',
                    '-i', 'pipe:0',  # Input from stdin
                    '-f', 's16le',   # Output format: signed 16-bit little-endian
                    '-acodec', 'pcm_s16le',  # PCM codec
                    '-ar', '16000',  # Sample rate: 16 kHz
                    '-ac', '1',      # Channels: mono
                    'pipe:1'         # Output to stdout
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Write input audio to ffmpeg stdin in a separate thread
            def write_input():
                try:
                    process.stdin.write(audio_content)
                    process.stdin.close()
                except Exception as e:
                    print(f"[PCM Stream] Error writing to ffmpeg: {e}")
            
            writer_thread = threading.Thread(target=write_input)
            writer_thread.start()
            
            # Read PCM output in chunks and yield immediately
            total_bytes = 0
            while True:
                chunk = process.stdout.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                yield chunk
            
            # Wait for writer thread and process to complete
            writer_thread.join()
            process.wait()
            
            # Check for errors
            if process.returncode != 0:
                stderr_output = process.stderr.read().decode('utf-8', errors='ignore')
                raise Exception(f"ffmpeg failed with return code {process.returncode}: {stderr_output}")
            
            print(f"[PCM Stream] Decoded {total_bytes} bytes of PCM audio")
            print(f"[PCM Stream] Duration: ~{total_bytes / 32000:.2f} seconds")
            
        except Exception as e:
            raise Exception(f"Failed to stream decode audio to PCM: {str(e)}")
    
    def transcribe_audio_chunk(self, audio_content: bytes, use_gcs: bool = False, gcs_uri: str = None) -> str:
        """
        Transcribe an audio chunk using Google Cloud Speech-to-Text API with streaming
        Configured for medical conversations without speaker diarization
        Streams PCM audio directly as it's decoded to avoid buffering and OOMs
        
        Args:
            audio_content: Audio file content in bytes (any format)
            use_gcs: Not used (kept for backward compatibility)
            gcs_uri: Not used (kept for backward compatibility)
            
        Returns:
            String containing the transcribed text
        """
        
        print(f"[Speech-to-Text] Starting streaming decode and recognition")
        print(f"[Speech-to-Text] Input audio size: {len(audio_content)} bytes")
        
        # Configure for PCM streaming
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            audio_channel_count=1,
            language_code="en-US",
            # Enable medical conversation model
            model="medical_conversation",
            use_enhanced=True,
            enable_automatic_punctuation=True
        )
        
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=False
        )
        
        try:
            # Generator that streams PCM chunks as they're decoded from ffmpeg
            def generate_audio_requests():
                """
                Stream decode audio to PCM and yield StreamingRecognizeRequest objects.
                This pipes audio through ffmpeg and sends PCM chunks immediately to Google STT.
                """
                for pcm_chunk in self._stream_decode_to_pcm(audio_content, chunk_size=4800):
                    yield speech.StreamingRecognizeRequest(audio_content=pcm_chunk)
            
            # Stream the audio to Google STT as it's being decoded
            requests = generate_audio_requests()
            responses = self.client.streaming_recognize(streaming_config, requests)
            
            print(f"[Speech-to-Text] Streaming recognition started, processing responses...")
            
            # Collect transcript text from streaming responses
            transcript_parts = []
            result_count = 0
            
            for response in responses:
                result_count += 1
                
                # Only process final results (not interim)
                for result in response.results:
                    if result.is_final and result.alternatives:
                        alternative = result.alternatives[0]
                        transcript_text = alternative.transcript
                        print(f"[Speech-to-Text] Final result {result_count}: {transcript_text[:100] if transcript_text else 'EMPTY'}")
                        
                        if transcript_text:
                            transcript_parts.append(transcript_text)
            
            print(f"[Speech-to-Text] Streaming completed")
            print(f"[Speech-to-Text] Total results processed: {result_count}")
            
            # Join all transcript parts with space
            full_transcript = " ".join(transcript_parts)
            print(f"[Speech-to-Text] Full transcript length: {len(full_transcript)} characters")
            
            return full_transcript
        
        except Exception as e:
            raise Exception(f"Speech-to-text transcription failed: {str(e)}")
