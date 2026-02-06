import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Mic, X, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { store } from "@/store";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { uploadAudioChunk, generateQuestions, finalizeAppointment } from "@/lib/api";

export function ListeningPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording, error: recordingError } = useAudioRecorder();
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Start recording when page loads
  useEffect(() => {
    const initRecording = async () => {
      const appointmentId = store.getCurrentRecordingId();
      if (!appointmentId) {
        setUploadError("No active appointment. Please start from Home or Appointments page.");
        return;
      }

      try {
        // Start recording with callback for 1-minute chunks
        await startRecording(async (chunk: Blob) => {
          try {
            console.log("Uploading audio chunk...");
            await uploadAudioChunk(appointmentId, chunk);
            console.log("Audio chunk uploaded successfully");
          } catch (err) {
            console.error("Failed to upload audio chunk:", err);
            setUploadError("Failed to upload audio. Recording continues...");
          }
        });
      } catch (err) {
        console.error("Failed to start recording:", err);
        setUploadError("Failed to access microphone. Please check permissions.");
      }
    };

    initRecording();

    // Cleanup: stop recording if user navigates away
    return () => {
      stopRecording();
    };
  }, []);

  const handleGenerateQuestions = async () => {
    const appointmentId = store.getCurrentRecordingId();
    if (!appointmentId) {
      setUploadError("No active appointment");
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      setUploadError(null);
      
      const { questions: generatedQuestions } = await generateQuestions(appointmentId);
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to generate questions:", err);
      setUploadError("Failed to generate questions. Please try again.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const closeQuestionsModal = () => {
    setQuestions(null);
  };

  const handleEnd = async () => {
    const appointmentId = store.getCurrentRecordingId();
    
    try {
      setIsProcessing(true);
      setUploadError(null);

      if (!appointmentId) {
        throw new Error("No active appointment");
      }

      // Stop recording and get full audio (always stop, even if finalize fails)
      const fullAudio = await stopRecording();

      // Finalize appointment (generate SOAP note) with full audio
      await finalizeAppointment(appointmentId, fullAudio);

      // Don't save to store - will fetch from backend
      store.endRecording();
      
      // Navigate to appointments list
      navigate("/appointments");
    } catch (err) {
      console.error("Failed to end appointment:", err);
      
      // Always end recording session even if finalize failed
      store.endRecording();
      
      setUploadError("Failed to save appointment. Recording has been stopped.");
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (!isRecording && !isProcessing) {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Back Button */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={handleBack}
          disabled={isRecording || isProcessing}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Recording</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Error Messages */}
          {(recordingError || uploadError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {recordingError || uploadError}
            </div>
          )}

          {/* Recording Indicator */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'
              }`}>
                <Mic className={`w-12 h-12 ${isRecording ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <span className={`text-white text-xs px-3 py-1 rounded-full ${
                  isRecording ? 'bg-red-600' : 'bg-gray-400'
                }`}>
                  {isRecording ? 'Recording' : 'Not Recording'}
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-center">
              {isRecording ? 'Listening and taking notes...' : 'Microphone access required'}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <button
              onClick={handleGenerateQuestions}
              disabled={isGeneratingQuestions || questions !== null}
              className={`w-full rounded-full py-4 px-6 transition-colors ${
                questions !== null
                  ? "bg-green-100 text-green-700 cursor-default"
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              }`}
            >
              {isGeneratingQuestions ? "Generating..." : questions !== null ? "Questions Generated" : "Generate Questions"}
            </button>
            
            <button
              onClick={handleEnd}
              disabled={isProcessing}
              className="w-full bg-gray-900 text-white rounded-full py-4 px-6 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Ending..." : "End"}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Questions Modal */}
      {questions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            {/* Close button */}
            <button
              onClick={closeQuestionsModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Modal content */}
            <h2 className="text-xl font-semibold mb-4">Suggested Questions</h2>
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-lg"
                >
                  <p className="text-gray-800">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
