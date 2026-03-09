from google.cloud import speech
import subprocess
import tempfile
import os
import threading

# Map file extensions to Google Speech-to-Text AudioEncoding values.
# Formats not in this map (e.g. m4a, mp4) need to be converted to FLAC first.
_EXTENSION_TO_ENCODING: dict[str, speech.RecognitionConfig.AudioEncoding] = {
    "webm": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    "ogg":  speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
    "opus": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
    "flac": speech.RecognitionConfig.AudioEncoding.FLAC,
    "wav":  speech.RecognitionConfig.AudioEncoding.LINEAR16,
    "mp3":  speech.RecognitionConfig.AudioEncoding.MP3,
}

# Extensions that require conversion to FLAC before Speech-to-Text can process them
_NEEDS_CONVERSION_EXTENSIONS: set[str] = {"m4a", "mp4", "aac", "m4b", "mp4a"}


class SpeechToTextService:
    """Service for converting audio chunks to text using Google Cloud Speech-to-Text"""
    
    def __init__(self, project_id: str = None, location: str = "us-central1", bucket_name: str = None):
        self.client = speech.SpeechClient()
        self.project_id = project_id
        self.location = location
        self.bucket_name = bucket_name

    def batch_transcribe(self, audio_gcs_uri: str, storage_service=None, timeout: int = 300) -> str:
        """
        Transcribe a full audio recording using V1 LongRunningRecognize.
        The audio must already be in GCS. Uses the global Speech API endpoint
        so the medical_conversation model is available without region restrictions.

        If the audio format is not natively supported (e.g. m4a/AAC), the file is
        downloaded from GCS, converted to FLAC via ffmpeg, re-uploaded, and then
        transcribed.

        Args:
            audio_gcs_uri: GCS URI of the audio file (e.g. gs://bucket/path/file.webm)
            storage_service: StorageService instance (required when the audio format
                needs conversion, e.g. m4a → FLAC).
            timeout: Max seconds to wait for the operation (default 300)

        Returns:
            Combined transcript string from the full recording.
        """
        print(f"[LongRunning STT] Starting transcription for: {audio_gcs_uri}")

        # Resolve encoding from the GCS URI file extension.
        # If the format needs conversion (e.g. m4a), convert to FLAC first.
        encoding, sample_rate, needs_conversion = self._encoding_from_uri(audio_gcs_uri)

        if needs_conversion:
            if storage_service is None:
                raise ValueError(
                    "storage_service is required to convert unsupported audio "
                    f"formats. URI: {audio_gcs_uri}"
                )
            audio_gcs_uri = self._convert_and_reupload_as_flac(
                audio_gcs_uri, storage_service
            )
            encoding = speech.RecognitionConfig.AudioEncoding.FLAC
            # Don't set sample_rate for FLAC — it's embedded in the FLAC header
            # and letting the API auto-detect avoids mismatches.
            sample_rate = None

        # Try medical_conversation model first, fall back to "long"
        model = "medical_conversation"
        try:
            transcript = self._run_long_running_recognize(
                audio_gcs_uri=audio_gcs_uri,
                model=model,
                timeout=timeout,
                encoding=encoding,
                sample_rate_hertz=sample_rate,
            )

            # DEBUG: If medical_conversation returned empty, retry with model="default"
            # to determine if the issue is model-specific or audio-specific.
            if not transcript.strip():
                print(f"[LongRunning STT] DEBUG: medical_conversation returned empty. "
                      f"Retrying with model='default' for comparison...")
                default_transcript = self._run_long_running_recognize(
                    audio_gcs_uri=audio_gcs_uri,
                    model="default",
                    timeout=timeout,
                    encoding=encoding,
                    sample_rate_hertz=sample_rate,
                )
                print(f"[LongRunning STT] DEBUG: model='default' returned "
                      f"{len(default_transcript)} chars, "
                      f"'{default_transcript[:200]}...' "
                      if default_transcript else
                      f"[LongRunning STT] DEBUG: model='default' also returned empty")
                # Use the default transcript if it produced results
                if default_transcript.strip():
                    print(f"[LongRunning STT] DEBUG: Using model='default' transcript as fallback")
                    return default_transcript

            return transcript
        except Exception as e:
            error_str = str(e)
            # Only fall back when the error is clearly about the *model* not being available
            if "medical_conversation" in error_str.lower() or "model" in error_str.lower():
                print(f"[LongRunning STT] WARNING: model '{model}' not available, falling back to 'long'. Error was: {error_str}")
                model = "long"
                transcript = self._run_long_running_recognize(
                    audio_gcs_uri=audio_gcs_uri,
                    model=model,
                    timeout=timeout,
                    encoding=encoding,
                    sample_rate_hertz=sample_rate,
                )
                return transcript
            else:
                raise

    @staticmethod
    def _encoding_from_uri(gcs_uri: str):
        """
        Determine the AudioEncoding and sample rate from a GCS URI's file extension.

        Returns:
            (encoding, sample_rate_hertz, needs_conversion)
            - encoding may be None for auto-detect.
            - sample_rate_hertz may be None when not required.
            - needs_conversion is True when the format must be converted to FLAC first.
        """
        extension = ""
        if "." in gcs_uri:
            extension = gcs_uri.rsplit(".", 1)[-1].lower()

        # Check if format needs conversion (e.g. m4a, mp4, aac)
        if extension in _NEEDS_CONVERSION_EXTENSIONS:
            print(f"[LongRunning STT] Format .{extension} requires conversion to FLAC")
            return None, None, True

        encoding = _EXTENSION_TO_ENCODING.get(extension)

        if encoding is not None:
            # LINEAR16 (wav) requires an explicit sample rate; others do not
            sample_rate = 16000 if encoding == speech.RecognitionConfig.AudioEncoding.LINEAR16 else None
            print(f"[LongRunning STT] Resolved encoding for .{extension}: {encoding}")
            return encoding, sample_rate, False

        # Unknown extension — leave encoding unset and let the API try auto-detect
        print(f"[LongRunning STT] Unknown extension '.{extension}', leaving encoding unset for auto-detect")
        return None, None, False

    @staticmethod
    def _convert_to_flac(audio_content: bytes) -> bytes:
        """
        Convert audio bytes (any format ffmpeg supports) to mono 16 kHz FLAC.

        Uses temporary files instead of stdin/stdout pipes because container
        formats like M4A/MP4 require seeking (for the moov atom), which is
        not possible through a pipe.  Writing to a temp file lets ffmpeg
        seek freely and decode the entire file correctly.

        Equivalent to: ffmpeg -i input.m4a -ac 1 -ar 16000 output.flac

        Args:
            audio_content: Raw audio file bytes (m4a, mp4, aac, etc.)

        Returns:
            FLAC-encoded audio bytes (mono, 16 kHz).
        """
        print(f"[Convert] Converting {len(audio_content)} bytes to FLAC (mono, 16 kHz)...")

        # Write input to a temp file so ffmpeg can seek (required for m4a/mp4
        # containers whose moov atom may be at the end of the file).
        input_fd, input_path = tempfile.mkstemp(suffix=".m4a")
        output_fd, output_path = tempfile.mkstemp(suffix=".flac")
        try:
            os.write(input_fd, audio_content)
            os.close(input_fd)
            os.close(output_fd)  # close so ffmpeg can write to it

            result = subprocess.run(
                [
                    "ffmpeg",
                    "-y",                  # overwrite output file
                    "-i", input_path,      # read from temp file (seekable)
                    "-ac", "1",            # mono
                    "-ar", "16000",        # 16 kHz sample rate
                    "-f", "flac",          # output format
                    output_path,           # write to temp file
                ],
                capture_output=True,
                text=True,
            )

            if result.returncode != 0:
                raise RuntimeError(
                    f"ffmpeg conversion to FLAC failed (exit code {result.returncode}): {result.stderr}"
                )

            with open(output_path, "rb") as f:
                flac_content: bytes = f.read()

            print(f"[Convert] Conversion complete: {len(flac_content)} bytes of FLAC audio")

            # Run ffprobe on the output FLAC to log its properties for debugging
            try:
                probe_result = subprocess.run(
                    [
                        "ffprobe",
                        "-v", "error",
                        "-show_format",
                        "-show_streams",
                        "-print_format", "json",
                        output_path,
                    ],
                    capture_output=True,
                    text=True,
                    timeout=15,
                )
                print(f"[Convert] ffprobe output for converted FLAC:\n{probe_result.stdout}")
                if probe_result.stderr:
                    print(f"[Convert] ffprobe stderr: {probe_result.stderr}")
            except Exception as probe_err:
                print(f"[Convert] WARNING: ffprobe inspection failed: {probe_err}")

            return flac_content
        finally:
            # Clean up temp files
            for path in (input_path, output_path):
                try:
                    if os.path.exists(path):
                        os.remove(path)
                except OSError:
                    pass

    def _convert_and_reupload_as_flac(self, audio_gcs_uri: str, storage_service) -> str:
        """
        Download an unsupported audio file from GCS, convert it to FLAC via ffmpeg,
        re-upload the FLAC to GCS, and return the new GCS URI.

        Args:
            audio_gcs_uri: GCS URI of the original audio (e.g. gs://bucket/path/file.m4a)
            storage_service: StorageService instance for download/upload.

        Returns:
            GCS URI of the newly uploaded FLAC file.
        """
        print(f"[Convert] Downloading original audio from GCS: {audio_gcs_uri}")
        audio_content = storage_service.download_file(audio_gcs_uri)
        print(f"[Convert] Downloaded {len(audio_content)} bytes")

        flac_content = self._convert_to_flac(audio_content)

        # Build the FLAC filename next to the original file
        flac_gcs_path = audio_gcs_uri.rsplit(".", 1)[0] + "_converted.flac"
        # Strip the gs://bucket/ prefix to get the blob path
        bucket_name = storage_service.bucket.name
        blob_path = flac_gcs_path.split(f"gs://{bucket_name}/", 1)[-1]

        flac_gcs_uri = storage_service.upload_file(
            flac_content, blob_path, content_type="audio/flac"
        )
        print(f"[Convert] Uploaded converted FLAC to GCS: {flac_gcs_uri}")

        return flac_gcs_uri

    def _run_long_running_recognize(
        self,
        audio_gcs_uri: str,
        model: str,
        timeout: int,
        encoding=None,
        sample_rate_hertz: int = None,
    ) -> str:
        """
        Execute a V1 LongRunningRecognize request and return the combined transcript.
        Uses the global Speech API endpoint — no region-specific model restrictions.

        Args:
            audio_gcs_uri: GCS URI of the input audio.
            model: STT model name (e.g. "medical_conversation", "long").
            timeout: Operation timeout in seconds.
            encoding: AudioEncoding enum value, or None for auto-detect.
            sample_rate_hertz: Sample rate in Hz, or None if not required.

        Returns:
            Combined transcript string.
        """
        print(f"[LongRunning STT] Using model: {model}, encoding: {encoding}")

        # Build config — set encoding explicitly when known so the API
        # doesn't have to guess (avoids "bad encoding" errors).
        config_kwargs: dict = {
            "language_code": "en-US",
            "model": model,
            "use_enhanced": True,
            "enable_automatic_punctuation": True,
        }
        if encoding is not None:
            config_kwargs["encoding"] = encoding
        if sample_rate_hertz is not None:
            config_kwargs["sample_rate_hertz"] = sample_rate_hertz

        # Log the full config for debugging
        print(f"[LongRunning STT] DEBUG RecognitionConfig: {config_kwargs}")

        config = speech.RecognitionConfig(**config_kwargs)

        audio = speech.RecognitionAudio(uri=audio_gcs_uri)

        print(f"[LongRunning STT] Sending long_running_recognize request to URI: {audio_gcs_uri}")
        operation = self.client.long_running_recognize(config=config, audio=audio)

        print(f"[LongRunning STT] Waiting for operation to complete (timeout={timeout}s)...")
        response = operation.result(timeout=timeout)

        # Log raw response details for debugging
        total_results = len(response.results)
        print(f"[LongRunning STT] DEBUG: response.results count = {total_results}")
        for idx, result in enumerate(response.results):
            num_alts = len(result.alternatives) if result.alternatives else 0
            alt_preview = ""
            if num_alts > 0:
                alt_preview = result.alternatives[0].transcript[:100] if result.alternatives[0].transcript else "(empty string)"
            print(f"[LongRunning STT] DEBUG: result[{idx}] alternatives={num_alts}, "
                  f"confidence={result.alternatives[0].confidence if num_alts > 0 else 'N/A'}, "
                  f"preview='{alt_preview}'")

        # Combine all transcript segments
        transcript_parts: list[str] = []
        for result in response.results:
            if result.alternatives:
                transcript_text = result.alternatives[0].transcript
                if transcript_text:
                    transcript_parts.append(transcript_text)

        full_transcript = " ".join(transcript_parts)
        print(f"[LongRunning STT] Transcription complete: {len(full_transcript)} characters, {len(transcript_parts)} segments")

        return full_transcript
    
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
