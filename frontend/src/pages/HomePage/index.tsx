import { useNavigate } from "react-router";
import { BottomNav } from "@/components/shared/BottomNav";
import { store } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Mic, X } from "lucide-react";
import { startAppointment, uploadAudioChunk, generateQuestions, finalizeAppointment } from "@/lib/api";
import { useState, useEffect } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

export function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording, error: recordingError } = useAudioRecorder();
  const [error, setError] = useState<string | null>(null);

  const handleRecordingClick = async () => {
    const appointmentId = store.getCurrentRecordingId();
    
    if (!isRecordingActive) {
      // Start new recording
      try {
        setError(null);

        // Start appointment on backend
        const { appointmentId: newAppointmentId } = await startAppointment();
        
        // Store appointment ID
        store.startRecording(newAppointmentId);
        
        // Start recording with callback for 1-minute chunks
        await startRecording(async (chunk: Blob) => {
          try {
            console.log("Uploading audio chunk...");
            await uploadAudioChunk(newAppointmentId, chunk);
            console.log("Audio chunk uploaded successfully");
          } catch (err) {
            console.error("Failed to upload audio chunk:", err);
            setError("Failed to upload audio. Recording continues...");
          }
        });
        
        setIsRecordingActive(true);
      } catch (err) {
        console.error("Failed to start appointment:", err);
        setError("Failed to start appointment. Please try again.");
      }
    }
  };

  const handleGenerateQuestions = async () => {
    const appointmentId = store.getCurrentRecordingId();
    if (!appointmentId) {
      setError("No active appointment");
      return;
    }

    try {
      setIsGeneratingQuestions(true);
      setError(null);
      
      const { questions: generatedQuestions } = await generateQuestions(appointmentId);
      setQuestions(generatedQuestions);
    } catch (err) {
      console.error("Failed to generate questions:", err);
      setError("Failed to generate questions. Please try again.");
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
      setError(null);

      if (!appointmentId) {
        throw new Error("No active appointment");
      }

      // Stop recording and get full audio (always stop, even if finalize fails)
      const fullAudio = await stopRecording();

      // Finalize appointment (generate SOAP note) with full audio
      await finalizeAppointment(appointmentId, fullAudio);

      // Don't save to store - will fetch from backend
      store.endRecording();
      
      // Reset state
      setIsRecordingActive(false);
      setQuestions(null);
      setIsProcessing(false);
      
      // Navigate to appointments list
      navigate("/appointments");
    } catch (err) {
      console.error("Failed to end appointment:", err);
      
      // Always end recording session even if finalize failed
      store.endRecording();
      
      setError("Failed to save appointment. Recording has been stopped.");
      setIsRecordingActive(false);
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Sign Out */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium">{user?.displayName}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Error Messages */}
          {(recordingError || error) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {recordingError || error}
            </div>
          )}

          {/* Recording Button - Always visible */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="relative">
              <button
                onClick={handleRecordingClick}
                disabled={isRecordingActive || isProcessing}
                className={`rounded-full flex items-center justify-center transition-all shadow-lg ${
                  isRecordingActive 
                    ? 'w-24 h-24'
                    : 'w-36 h-36 hover:scale-105'
                } ${
                  isRecording 
                    ? 'bg-red-100 animate-pulse' 
                    : isRecordingActive 
                      ? 'bg-gray-100'
                      : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label={isRecordingActive ? "Recording" : "Start Recording"}
              >
                <Mic className={`${
                  isRecordingActive 
                    ? isRecording ? 'w-12 h-12 text-red-600' : 'w-12 h-12 text-gray-400'
                    : 'w-16 h-16 text-white'
                }`} />
              </button>
              {isRecordingActive && isRecording && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="text-white text-xs px-3 py-1 rounded-full bg-red-600">
                    Recording
                  </span>
                </div>
              )}
            </div>
            {isRecordingActive && isRecording && (
              <p className="text-gray-600 text-center">
                Listening and taking notes...
              </p>
            )}
          </div>

          {/* Controls - Show only when recording is active */}
          {isRecordingActive && (
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
          )}
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
