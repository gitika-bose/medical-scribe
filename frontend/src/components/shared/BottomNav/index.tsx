import { useNavigate, useLocation } from "react-router";
import { Home, Calendar } from "lucide-react";
import { store } from "@/store";
import { useState, useEffect } from "react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRecording, setIsRecording] = useState(false);

  // Poll recording state periodically
  useEffect(() => {
    const checkRecordingState = () => {
      setIsRecording(store.isRecordingActive());
    };

    // Check immediately
    checkRecordingState();

    // Poll every 500ms to catch state changes
    const interval = setInterval(checkRecordingState, 500);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (path: string) => {
    if (isRecording) {
      // Prevent navigation during recording
      return;
    }
    navigate(path);
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around py-4 max-w-2xl mx-auto">
        <button
          onClick={() => handleNavigation("/home")}
          disabled={isRecording}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            isRecording
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : location.pathname === "/home"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title={isRecording ? "Cannot navigate during recording" : "Home"}
        >
          <Home className="w-6 h-6" />
          <span className="text-sm">Home</span>
        </button>
        
        <button
          onClick={() => handleNavigation("/appointments")}
          disabled={isRecording}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            isRecording
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : location.pathname === "/appointments"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
          title={isRecording ? "Cannot navigate during recording" : "Appointments"}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm">Appointments</span>
        </button>
      </div>
    </div>
  );
}
