from google.cloud import speech
import io
import wave

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
    
    def _get_sample_rate(self, audio_content: bytes) -> int:
        """Extract sample rate from WAV file header"""
        try:
            with wave.open(io.BytesIO(audio_content), 'rb') as wav_file:
                return wav_file.getframerate()
        except:
            # Default to 16000 if can't read WAV header
            return 16000
    
    def _get_audio_duration(self, audio_content: bytes) -> float:
        """Get audio duration in seconds from WAV file"""
        try:
            with wave.open(io.BytesIO(audio_content), 'rb') as wav_file:
                frames = wav_file.getnframes()
                rate = wav_file.getframerate()
                duration = frames / float(rate)
                return duration
        except:
            return 0
    
    def transcribe_audio_chunk(self, audio_content: bytes, use_gcs: bool = False, gcs_uri: str = None) -> list:
        """
        Transcribe an audio chunk using Google Cloud Speech-to-Text API
        Configured for medical conversations with speaker diarization
        Uses long-running recognition with inline audio or GCS URI
        
        Args:
            audio_content: Audio file content in bytes
            use_gcs: Whether to use GCS URI instead of inline audio
            gcs_uri: GCS URI if use_gcs is True
            
        Returns:
            List of dicts with speaker turns:
                - speaker (int): Speaker tag
                - text (str): Text spoken by that speaker
        """
        
        # Create audio object based on method
        if use_gcs and gcs_uri:
            audio = speech.RecognitionAudio(uri=gcs_uri)
        else:
            audio = speech.RecognitionAudio(content=audio_content)
        
        # Get sample rate and duration from the audio file (for logging)
        sample_rate = self._get_sample_rate(audio_content) if not use_gcs else 48000
        duration = self._get_audio_duration(audio_content) if not use_gcs else 0
        
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,  # Explicitly set to 48000 for WEBM Opus
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
        
        try:
            # Use synchronous recognition for inline audio
            if use_gcs:
                # Use long-running for GCS (not currently used)
                operation = self.client.long_running_recognize(config=config, audio=audio)
                print(f"[Speech-to-Text] Started long-running recognition, waiting for result...")
                response = operation.result(timeout=120)
                print(f"[Speech-to-Text] Recognition completed")
            else:
                # Use synchronous for inline audio
                print(f"[Speech-to-Text] Using synchronous recognition for inline audio")
                print(f"[Speech-to-Text] Audio content size: {len(audio_content)} bytes")
                response = self.client.recognize(config=config, audio=audio)
                print(f"[Speech-to-Text] Synchronous recognition completed")
            
            # Debug: Print response structure
            print(f"[Speech-to-Text] Number of results: {len(response.results)}")
            for i, result in enumerate(response.results):
                print(f"[Speech-to-Text] Result {i}: {len(result.alternatives)} alternatives")
                if result.alternatives:
                    alt = result.alternatives[0]
                    print(f"[Speech-to-Text] Result {i} transcript: {alt.transcript[:100] if alt.transcript else 'EMPTY'}")
                    print(f"[Speech-to-Text] Result {i} has {len(alt.words)} words")
            
            # Extract words with speaker tags from ALL results (not just last)
            words = []
            if response.results:
                for result in response.results:
                    if result.alternatives:
                        alternative = result.alternatives[0]
                        for word_info in alternative.words:
                            words.append({
                                "word": word_info.word,
                                "speakerTag": word_info.speaker_tag
                            })
            
            print(f"[Speech-to-Text] Total words extracted: {len(words)}")
            
            # Stitch words into speaker turns
            stitched_transcript = stitch_diarized_words(words)
            print(f"[Speech-to-Text] Stitched into {len(stitched_transcript)} speaker turns")
            
            return stitched_transcript
        
        except Exception as e:
            raise Exception(f"Speech-to-text transcription failed: {str(e)}")
