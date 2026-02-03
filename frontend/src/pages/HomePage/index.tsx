import { useNavigate } from "react-router";
import { BottomNav } from "@/components/shared/BottomNav";
import { store } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Upload } from "lucide-react";
import { startAppointment, uploadRecording } from "@/lib/api";
import { useState, useRef } from "react";

export function HomePage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    try {
      setIsStarting(true);
      setError(null);

      // Start appointment on backend
      const { appointmentId } = await startAppointment();
      
      // Store appointment ID
      store.startRecording(appointmentId);
      
      // Navigate to listening page
      navigate("/listening");
    } catch (err) {
      console.error("Failed to start appointment:", err);
      setError("Failed to start appointment. Please try again.");
      setIsStarting(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      
      // Create appointment first
      const { appointmentId } = await startAppointment();
      
      // Start upload in background and navigate to appointments
      uploadRecording(appointmentId, file)
        .catch((err) => {
          console.error("Failed to upload recording:", err);
        });
      
      // Navigate to appointments page immediately
      navigate("/appointments");
      
    } catch (err) {
      console.error("Failed to start appointment:", err);
      setError("Failed to start appointment. Please try again.");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md">
            {error}
          </div>
        )}
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="bg-blue-600 text-white rounded-full px-20 py-8 text-2xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? "Starting..." : "Start"}
        </button>
        
        <button
          onClick={handleUploadClick}
          className="flex items-center gap-3 bg-white text-blue-600 border-2 border-blue-600 rounded-full px-12 py-4 text-lg hover:bg-blue-50 transition-colors shadow-md"
        >
          <Upload className="w-6 h-6" />
          <span>Upload</span>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
