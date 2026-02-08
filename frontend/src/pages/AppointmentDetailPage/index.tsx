import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BottomNav, DeleteAppointmentButton } from "@/components/shared";
import { 
  getSingleAppointment,
  type Appointment 
} from "@/lib/api";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  SummarySection,
  ReasonForVisitSection,
  DiagnosisSection,
  TodosSection,
  FollowUpSection,
  LearningsSection,
  DocumentsUpload,
} from "@/components/pages/AppointmentDetailPage";

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedDocs, setSavedDocs] = useState<string[]>([]);

  useEffect(() => {
    // Wait for auth to be ready
    if (authLoading) return;

    const loadAppointment = async () => {
      if (!id) {
        const errorMsg = "Invalid appointment ID";
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch real appointment directly (no subscription)
        const appointmentData = await getSingleAppointment(id);
        
        if (appointmentData) {
          setAppointment(appointmentData);
        } else {
          const errorMsg = "Appointment not found";
          setError(errorMsg);
          toast.error(errorMsg);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load appointment:", err);
        const errorMsg = err instanceof Error ? err.message : "Failed to load appointment";
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [id, user, authLoading]);

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

  // Show processing state if appointment is in progress
  if (appointment.status === 'InProgress') {
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
              <h1 className="text-xl">{getAppointmentTitle()}</h1>
              <p className="text-sm text-gray-500">
                {format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto p-6 pb-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-900 text-lg font-medium mb-2">Processing Appointment</p>
            <p className="text-gray-600">Please wait while we process your appointment...</p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

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
            <h1 className="text-xl">{getAppointmentTitle()}</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto p-6 pb-20 space-y-6">
        {/* Render processedSummary format if available */}
        {appointment.processedSummary ? (
          <>
            {/* Summary */}
            {appointment.processedSummary.summary && (
              <SummarySection summary={appointment.processedSummary.summary} />
            )}

            {/* Reason for Visit */}
            {appointment.processedSummary.reason_for_visit && (
              <ReasonForVisitSection reasonForVisit={appointment.processedSummary.reason_for_visit} />
            )}

            {/* Diagnosis */}
            {appointment.processedSummary.diagnosis && (
              <DiagnosisSection diagnosis={appointment.processedSummary.diagnosis} />
            )}

            {/* Action Items (Todos) */}
            {appointment.processedSummary.todos && (
              <TodosSection todos={appointment.processedSummary.todos} />
            )}

            {/* Follow-up */}
            {appointment.processedSummary.follow_up && (
              <FollowUpSection followUp={appointment.processedSummary.follow_up} />
            )}

            {/* Key Learnings */}
            {appointment.processedSummary.learnings && (
              <LearningsSection learnings={appointment.processedSummary.learnings} />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No summary available</p>
          </div>
        )}

        <DeleteAppointmentButton 
          appointmentId={id!}
          onDeleteError={setError}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
