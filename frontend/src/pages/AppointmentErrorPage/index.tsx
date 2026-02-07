import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, AlertCircle, MessageSquare } from "lucide-react";
import { BottomNav } from "@/components/shared";
import { format } from "date-fns";
import { getSingleAppointment, type Appointment } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function AppointmentErrorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    if (!user) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    const fetchAppointment = async () => {
      if (!id) {
        setError("Invalid appointment ID");
        setIsLoading(false);
        return;
      }

      try {
        const appointmentData = await getSingleAppointment(id);

        if (!appointmentData) {
          setError("Appointment not found");
          setIsLoading(false);
          return;
        }

        // Verify this is an error appointment
        if (appointmentData.status !== 'Error') {
          navigate(`/appointments/${id}`);
          return;
        }

        setAppointment(appointmentData);
      } catch (err) {
        console.error("Failed to fetch appointment:", err);
        setError("Failed to load appointment");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id, navigate, user, authLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading appointment...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">{error || "Appointment not found"}</p>
      </div>
    );
  }

  const getAppointmentTitle = (): string => {
    if (appointment.title) return appointment.title;
    if (appointment.doctor) return appointment.doctor;
    if (appointment.location) return `Appointment at ${appointment.location}`;
    return "Appointment Details";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/appointments")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl text-red-600">{getAppointmentTitle()}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto p-6 pb-20 space-y-6">
        {/* Error Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Processing Error
              </h2>
              <p className="text-red-800 mb-4">
                We encountered an error while processing this appointment.
              </p>
              {appointment.error && (
                <div className="bg-white rounded border border-red-200 p-4">
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {appointment.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Appointment Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="text-gray-900">
                {format(new Date(appointment.appointmentDate), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            {appointment.doctor && (
              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="text-gray-900">{appointment.doctor}</p>
              </div>
            )}
            {appointment.location && (
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900">{appointment.location}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Appointment ID</p>
              <p className="text-gray-900 font-mono text-sm">{appointment.appointmentId}</p>
            </div>
          </div>
        </div>

        {/* Feedback Button */}
        <button
          onClick={() => {
            // Placeholder - will be implemented later
            console.log("Feedback button clicked for appointment:", appointment.appointmentId);
          }}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Submit Feedback</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
