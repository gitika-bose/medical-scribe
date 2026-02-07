import { useNavigate } from "react-router";
import { BottomNav } from "@/components/shared/BottomNav";
import { store } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { Mic, X } from "lucide-react";
import { startAppointment, uploadAudioChunk, generateQuestions, finalizeAppointment } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

export function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isRecording, startRecording, stopRecording, error: recordingError } = useAudioRecorder();
  const [error, setError] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const autoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Auto-clear error messages after 5 seconds
  useEffect(() => {
    if (error) {
      // Clear any existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Set new timeout to clear error after 5 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    }

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  // Auto-timeout after 30 seconds
  useEffect(() => {
    if (isRecordingActive && isRecording) {
      // Start duration timer
      setRecordingDuration(0);
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Set 30-second auto-timeout
      autoTimeoutRef.current = setTimeout(() => {
        console.log("Auto-timeout: Stopping recording after 30 seconds");
        handleStopRecording();
      }, 30000); // 30 seconds
    } else {
      // Clear timers when not recording
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
        autoTimeoutRef.current = null;
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }

    return () => {
      if (autoTimeoutRef.current) {
        clearTimeout(autoTimeoutRef.current);
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRecordingActive, isRecording]);

  const handleRecordingClick = () => {
    if (!isRecordingActive) {
      // Show consent dialog first
      setShowConsentDialog(true);
    }
  };

  const handleConsentApproved = async () => {
    setShowConsentDialog(false);
    
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
  };

  const handleConsentDeclined = () => {
    setShowConsentDialog(false);
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
      
      // Check if questions were generated
      if (!generatedQuestions || generatedQuestions.length === 0) {
        // Show info message instead of error
        setError("No questions available at this time");
        setQuestions(null);
      } else {
        setQuestions(generatedQuestions);
      }
    } catch (err) {
      console.error("Failed to generate questions:", err);
      setError("No questions available at this time");
      setQuestions(null);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const closeQuestionsModal = () => {
    setQuestions(null);
  };

  const handleEndClick = () => {
    // Show confirmation dialog
    setShowEndDialog(true);
  };

  const handleStopRecording = async () => {
    const appointmentId = store.getCurrentRecordingId();
    
    // Clear timers
    if (autoTimeoutRef.current) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setShowEndDialog(false);

      if (!appointmentId) {
        throw new Error("No active appointment");
      }

      // Stop recording and get full audio
      const fullAudio = await stopRecording();

      // Store the appointment ID for metadata page
      store.setLastCompletedAppointmentId(appointmentId);
      
      // End recording session
      store.endRecording();
      
      // Reset state
      setIsRecordingActive(false);
      setQuestions(null);
      setIsProcessing(false);

      // Start finalize in background (don't wait for it)
      finalizeAppointment(appointmentId, fullAudio).catch((err) => {
        console.error("Background finalization error:", err);
        // Error handling is done in the background, user already navigated
      });

      // Navigate to metadata page immediately
      navigate("/appointment-metadata");
    } catch (err) {
      console.error("Failed to stop recording:", err);
      
      // Always end recording session even if stop failed
      if (appointmentId) {
        store.setLastCompletedAppointmentId(appointmentId);
      }
      store.endRecording();
      
      setError("Failed to save recording. Please try again.");
      setIsRecordingActive(false);
      setIsProcessing(false);
      setShowEndDialog(false);
      
      // Still navigate to metadata page
      navigate("/appointment-metadata");
    }
  };

  const handleCancelEnd = () => {
    setShowEndDialog(false);
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Juno</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-sm">Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Error Messages */}
          {(recordingError || error) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
              {recordingError || error}
            </div>
          )}

          {/* Recording Button - Always visible */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="relative">
              <button
                onClick={handleRecordingClick}
                disabled={isRecordingActive || isProcessing}
                className={`rounded-full flex items-center justify-center transition-all duration-500 ease-in-out shadow-lg ${
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
                <Mic className={`transition-all duration-500 ease-in-out ${
                  isRecordingActive 
                    ? isRecording ? 'w-12 h-12 text-red-600' : 'w-12 h-12 text-gray-400'
                    : 'w-16 h-16 text-white'
                }`} />
              </button>
              {isRecordingActive && isRecording && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-white text-xs px-3 py-1 rounded-full bg-red-600">
                    Recording
                  </span>
                </div>
              )}
            </div>
            
            {/* Dynamic text based on state */}
            <div className="text-center min-h-[24px] transition-all duration-300">
              {isRecordingActive && isRecording && (
                <p className="text-gray-600 animate-in fade-in slide-in-from-top-2 duration-300">
                  Listening and taking notes...
                </p>
              )}
            </div>
          </div>

          {/* Controls - Show only when recording is active */}
          {isRecordingActive && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                onClick={handleEndClick}
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

      {/* Consent Dialog */}
      <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recording Consent</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Does the doctor agree to recording this appointment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConsentDeclined}>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsentApproved}>
              Yes, Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Recording Confirmation Dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop the recording? This will end the appointment session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelEnd}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopRecording}>
              Yes, Stop Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Questions Modal */}
      {questions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
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
                  className="p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
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
