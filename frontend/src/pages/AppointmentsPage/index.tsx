import { useNavigate } from "react-router";
import { ChevronRight, Calendar, Plus, Upload, Mic, Loader2, AlertCircle } from "lucide-react";
import { BottomNav } from "@/components/shared/BottomNav";
import { toast } from "sonner";
import { store } from "@/store";
import { format } from "date-fns";
import { 
  startAppointment, 
  uploadRecording, 
  fetchAppointments,
  listenToInProgressAppointments,
  type AppointmentWithId
} from "@/lib/api";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithId[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inProgressAppointments, setInProgressAppointments] = useState<AppointmentWithId[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial load of all appointments
  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    const loadAppointments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch real appointments directly (no subscription)
        const fetchedAppointments = await fetchAppointments();

        setAppointments(fetchedAppointments);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setError(err instanceof Error ? err.message : "Failed to load appointments");
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, [user, authLoading]);

  // Set up real-time listener for InProgress appointments
  useEffect(() => {
    if (authLoading || !user) return;

    
    const unsubscribe = listenToInProgressAppointments(
      (updatedInProgressAppointments) => {
        setInProgressAppointments(updatedInProgressAppointments);
        
        // Refresh full appointment list to catch status changes
        // (when an appointment moves from InProgress to Completed/Error)
        fetchAppointments()
          .then((refreshedAppointments) => {
            setAppointments(refreshedAppointments);
          })
          .catch((err) => {
            console.error('Failed to refresh appointments:', err);
          });
      },
      (error) => {
        console.error('❌ Listener error:', error);
        toast.error('Failed to listen for appointment updates');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user, authLoading]);

  // Merge all appointments with real-time InProgress updates
  const allAppointments = useMemo(() => {
    // Create a map of all appointments by ID
    const appointmentMap = new Map<string, AppointmentWithId>();
    
    // Add all appointments from the initial fetch
    appointments.forEach(apt => appointmentMap.set(apt.appointmentId, apt));
    
    // Override with real-time InProgress appointments (they are more current)
    inProgressAppointments.forEach(apt => appointmentMap.set(apt.appointmentId, apt));
    
    // Convert back to array and sort by date
    const merged = Array.from(appointmentMap.values());
    merged.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    
    return merged;
  }, [appointments, inProgressAppointments]);

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
      navigate("/home");
    } catch (err) {
      console.error("Failed to start appointment:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to start appointment";
      toast.error(errorMsg);
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
      
      // Store the appointment ID for metadata page
      store.setLastCompletedAppointmentId(appointmentId);
      
      // Set processing state and start upload in background
      setIsProcessing(true);
      toast.success("Upload started! Processing in background...");
      
      // Fire and forget - upload in background
      uploadRecording(appointmentId, file)
        .then(() => {
          setIsProcessing(false);
          toast.success("Recording uploaded and processed successfully!");
        })
        .catch((err) => {
          console.error("Failed to upload recording:", err);
          const errorMsg = err instanceof Error ? err.message : "Failed to upload recording";
          setError(errorMsg);
          toast.error(errorMsg);
          setIsProcessing(false);
        });
      
      // Navigate to metadata page immediately
      navigate("/appointment-metadata");
      
    } catch (err) {
      console.error("Failed to start appointment:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to start appointment";
      setError(errorMsg);
      toast.error(errorMsg);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAppointmentTitle = (appointment: AppointmentWithId): string => {
    if (appointment.title) return appointment.title;
    if (appointment.doctor) return appointment.doctor;
    if (appointment.location) return `Appointment at ${appointment.location}`;
    return format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a");
  };

  const handleAppointmentClick = (appointment: AppointmentWithId) => {
    if (appointment.status === 'Error') {
      navigate(`/appointments/${appointment.appointmentId}/error`);
    } else {
      navigate(`/appointments/${appointment.appointmentId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Juno</h1>
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
              accept="audio/*,.wav,.mp3,.webm,.ogg,.m4a,.aac,.flac,.opus,.amr"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 max-w-2xl md:max-w-2xl lg:max-w-2xl w-full mx-auto p-6 pb-20">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        ) : allAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments found</p>
            <p className="text-sm text-gray-500 mt-2">
              Start a recording to create your first appointment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allAppointments.map((appointment) => {
              const isError = appointment.status === 'Error';
              const isInProgress = appointment.status === 'InProgress';
              
              return (
                <button
                  key={appointment.appointmentId}
                  onClick={() => handleAppointmentClick(appointment)}
                  className={`w-full rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow border ${
                    isError
                      ? 'bg-red-50 border-red-300'
                      : isInProgress
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className={`text-sm mb-1 ${
                      isError ? 'text-red-600' : 
                      isInProgress ? 'text-blue-600' : 
                      'text-gray-500'
                    }`}>
                      {format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    <p className={`line-clamp-2 ${
                      isError ? 'text-red-900' : 
                      isInProgress ? 'text-blue-900' : 
                      'text-gray-900'
                    }`}>
                      {getAppointmentTitle(appointment)}
                    </p>
                  </div>
                  {isInProgress ? (
                    <Loader2 className="w-5 h-5 ml-4 flex-shrink-0 text-blue-600 animate-spin" />
                  ) : isError ? (
                    <AlertCircle className="w-5 h-5 ml-4 flex-shrink-0 text-red-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 ml-4 flex-shrink-0 text-gray-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Processing Notification */}
      {isProcessing && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white px-6 py-3 shadow-lg z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm">Processing recent appointment upload...</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
