import { useNavigate } from "react-router";
import { ChevronRight, Calendar, ArrowLeft, Plus, Upload, Mic } from "lucide-react";
import { store } from "@/store";
import { format } from "date-fns";
import { startAppointment, getAppointments, uploadRecording } from "@/lib/api";
import { useState, useEffect, useRef } from "react";

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const { appointments: fetchedAppointments } = await getAppointments();
        setAppointments(fetchedAppointments);
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
        setError("Failed to load appointments");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewAppointment = async () => {
    try {
      setIsStarting(true);
      setShowDropdown(false);
      const { appointmentId } = await startAppointment();
      store.startRecording(appointmentId);
      navigate("/listening");
    } catch (err) {
      console.error("Failed to start appointment:", err);
      setIsStarting(false);
    }
  };

  const handleUploadClick = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Create appointment first
      const { appointmentId } = await startAppointment();
      
      // Set processing state and start upload in background
      setIsProcessing(true);
      
      // Fire and forget - upload in background
      uploadRecording(appointmentId, file)
        .then(() => {
          // Refresh appointments list when done
          return getAppointments();
        })
        .then(({ appointments: fetchedAppointments }) => {
          setAppointments(fetchedAppointments);
          setIsProcessing(false);
        })
        .catch((err) => {
          console.error("Failed to upload recording:", err);
          setError("Failed to upload recording");
          setIsProcessing(false);
        });
      
    } catch (err) {
      console.error("Failed to start appointment:", err);
      setError("Failed to start appointment");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-refresh appointments periodically (every 10 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { appointments: fetchedAppointments } = await getAppointments();
        setAppointments(fetchedAppointments);
      } catch (err) {
        console.error("Failed to refresh appointments:", err);
      }
    }, 600000); // Refresh every 10 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/home")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl">Appointments</h1>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isStarting || isProcessing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>
                {isStarting ? "Starting..." : "New"}
              </span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handleNewAppointment}
                  disabled={isStarting}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                >
                  <Mic className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">Live Recording</span>
                </button>
                <button
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">Upload Recording</span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="max-w-2xl mx-auto p-6 pb-20">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : appointments.filter((appointment) => appointment.Status === 'Completed').length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start a recording to create your first appointment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments
              .filter((appointment) => appointment.Status === 'Completed')
              .map((appointment) => {
                // Get first subjective point or use appointmentId
                const summary = appointment.ProcessedSummary?.Subjective 
                  ? (typeof appointment.ProcessedSummary.Subjective === 'string' 
                      ? appointment.ProcessedSummary.Subjective 
                      : JSON.stringify(appointment.ProcessedSummary.Subjective))
                  : appointment.appointmentId;
                
                return (
                  <button
                    key={appointment.appointmentId}
                    onClick={() => navigate(`/appointments/${appointment.appointmentId}`)}
                    className="w-full bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex-1 text-left">
                      <p className="text-sm text-gray-500 mb-1">
                        {format(new Date(appointment.CreatedDate), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-gray-900 line-clamp-2">
                        {summary}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Processing Notification */}
      {isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white px-6 py-3 shadow-lg z-20">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Processing recent appointment upload...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
