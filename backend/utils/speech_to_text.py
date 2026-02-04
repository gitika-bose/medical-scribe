from google.cloud import speech
import io
from pydub import AudioSegment

def stitch_diarized_words(words):
    """
    Groups diarized words into speaker turns.

    Input:
        words: list of dicts with keys:
            - word (str)
            - speakerTag (int)

    Output:
        list of dicts:
            - speaker (int)
            - text (str)
    """
    if not words:
        return []

    stitched = []
    current_speaker = words[0]["speakerTag"]
    current_words = []

    for w in words:
        speaker = w["speakerTag"]
        word = w["word"]

        if speaker != current_speaker:
            stitched.append({
                "speaker": current_speaker,
                "text": " ".join(current_words)
            })
            current_speaker = speaker
            current_words = [word]
        else:
            current_words.append(word)

    # flush last segment
    stitched.append({
        "speaker": current_speaker,
        "text": " ".join(current_words)
    })

    return stitched

class SpeechToTextService:
    """Service for converting audio chunks to text using Google Cloud Speech-to-Text"""
    
    def __init__(self):
        self.client = speech.SpeechClient()
    
    def _decode_to_pcm(self, audio_content: bytes) -> bytes:
        """
        Decode any audio format to raw PCM (mono, 16-bit, 16 kHz)
        
        Args:
            audio_content: Audio file content in any format (webm, mp3, wav, etc.)
            
        Returns:
            Raw PCM audio bytes (mono, 16-bit, 16 kHz)
        """
        try:
            # Load audio using pydub (supports many formats via ffmpeg)
            audio = AudioSegment.from_file(io.BytesIO(audio_content))
            
            # Convert to mono, 16-bit, 16 kHz
            audio = audio.set_channels(1)  # mono
            audio = audio.set_sample_width(2)  # 16-bit = 2 bytes
            audio = audio.set_frame_rate(16000)  # 16 kHz
            
            # Export as raw PCM
            pcm_buffer = io.BytesIO()
            audio.export(pcm_buffer, format="raw")
            pcm_data = pcm_buffer.getvalue()
            
            print(f"[PCM Decode] Original size: {len(audio_content)} bytes")
            print(f"[PCM Decode] PCM size: {len(pcm_data)} bytes")
            print(f"[PCM Decode] Duration: {len(audio) / 1000:.2f} seconds")
            
            return pcm_data
        except Exception as e:
            raise Exception(f"Failed to decode audio to PCM: {str(e)}")
    
    def transcribe_audio_chunk(self, audio_content: bytes, use_gcs: bool = False, gcs_uri: str = None) -> list:
        """
        Transcribe an audio chunk using Google Cloud Speech-to-Text API with streaming
        Configured for medical conversations with speaker diarization
        Streams PCM audio in small frames to avoid buffering and OOMs
        
        Args:
            audio_content: Audio file content in bytes (any format)
            use_gcs: Not used (kept for backward compatibility)
            gcs_uri: Not used (kept for backward compatibility)
            
        Returns:
            List of dicts with speaker turns:
                - speaker (int): Speaker tag
                - text (str): Text spoken by that speaker
        """
        
        # Step 1: Decode to raw PCM (mono, 16-bit, 16 kHz)
        print(f"[Speech-to-Text] Decoding audio to PCM...")
        pcm_data = self._decode_to_pcm(audio_content)
        
        # Step 2: Configure for PCM streaming
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            audio_channel_count=1,
            language_code="en-US",
            # Enable medical conversation model
            model="medical_conversation",
            use_enhanced=True,
            enable_automatic_punctuation=True,
            diarization_config=speech.SpeakerDiarizationConfig(
                enable_speaker_diarization=True,
                min_speaker_count=2,
                max_speaker_count=2,
            )
        )
        
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=False
        )
        
        try:
            print(f"[Speech-to-Text] Starting streaming recognition")
            print(f"[Speech-to-Text] PCM data size: {len(pcm_data)} bytes")
            
            # Step 3: Stream PCM data in small frames (100-200ms chunks)
            # At 16kHz, 16-bit, mono: 16000 samples/sec * 2 bytes/sample = 32000 bytes/sec
            # 100ms = 3200 bytes, 200ms = 6400 bytes
            # We'll use 150ms chunks = 4800 bytes
            chunk_size = 4800  # ~150ms of audio
            
            def generate_audio_chunks():
                """Generator that yields audio chunks for streaming"""
                for i in range(0, len(pcm_data), chunk_size):
                    chunk = pcm_data[i:i + chunk_size]
                    yield speech.StreamingRecognizeRequest(audio_content=chunk)
            
            # Stream the audio
            requests = generate_audio_chunks()
            responses = self.client.streaming_recognize(streaming_config, requests)
            
            print(f"[Speech-to-Text] Streaming recognition started, processing responses...")
            
            # Step 4: Collect results from streaming responses
            words = []
            result_count = 0
            
            for response in responses:
                result_count += 1
                
                # Only process final results (not interim)
                for result in response.results:
                    if result.is_final and result.alternatives:
                        alternative = result.alternatives[0]
                        print(f"[Speech-to-Text] Final result {result_count}: {alternative.transcript[:100] if alternative.transcript else 'EMPTY'}")
                        
                        # Extract words with speaker tags
                        for word_info in alternative.words:
                            words.append({
                                "word": word_info.word,
                                "speakerTag": word_info.speaker_tag
                            })
            
            print(f"[Speech-to-Text] Streaming completed")
            print(f"[Speech-to-Text] Total results processed: {result_count}")
            print(f"[Speech-to-Text] Total words extracted: {len(words)}")
            
            # Step 5: Stitch words into speaker turns
            stitched_transcript = stitch_diarized_words(words)
            print(f"[Speech-to-Text] Stitched into {len(stitched_transcript)} speaker turns")
            
            return stitched_transcript
        
        except Exception as e:
            raise Exception(f"Speech-to-text transcription failed: {str(e)}")
