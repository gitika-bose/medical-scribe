import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/shared";
import { getAppointment, deleteAppointment } from "@/lib/api";
import { format } from "date-fns";
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
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedDocs, setSavedDocs] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;
      
      // Check if this is the mock appointment
      if (id === "mock-appointment-v1-2") {
        try {
          setIsLoading(true);
          // Import the v1-2 sample data
          const sampleAppData = await import("@/appSummary/sample/v1/v1-2_gp_claude.json");
          const mockAppointment = {
            appointmentId: "mock-appointment-v1-2",
            Status: "Completed",
            CreatedDate: sampleAppData.default.date || new Date().toISOString(),
            ProcessedSummary: {
              Subjective: `${sampleAppData.default.title}`,
              Assessment: sampleAppData.default.summary,
            },
            appSummaryV1_2: sampleAppData.default
          };
          setAppointment(mockAppointment);
          setSavedDocs([]);
        } catch (err) {
          console.error("Failed to load mock appointment:", err);
          setError("Failed to load appointment");
        } finally {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await getAppointment(id);
        setAppointment(data);
        setSavedDocs(data.documents || []);
      } catch (err) {
        console.error("Failed to fetch appointment:", err);
        setError("Failed to load appointment");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();
  }, [id]);

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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      await deleteAppointment(id);
      navigate("/appointments");
    } catch (err) {
      console.error("Failed to delete appointment:", err);
      setError("Failed to delete appointment");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
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
            <h1 className="text-xl">{appointment.appSummaryV1_2?.title || appointment.appSummaryV1?.name || "Appointment Details"}</h1>
            <p className="text-sm text-gray-500">
              {appointment.appSummaryV1_2?.doctor_name || appointment.appSummaryV1?.doctor_name || 
                (appointment.CreatedDate && format(new Date(appointment.CreatedDate), "MMM d, yyyy 'at' h:mm a"))}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto p-6 pb-20 space-y-6">
        {/* Render appSummaryV1_2 format if available */}
        {appointment.appSummaryV1_2 ? (
          <>
            {/* Summary */}
            {appointment.appSummaryV1_2.summary && (
              <SummarySection summary={appointment.appSummaryV1_2.summary} />
            )}

            {/* Reason for Visit */}
            {appointment.appSummaryV1_2.reason_for_visit && (
              <ReasonForVisitSection reasonForVisit={appointment.appSummaryV1_2.reason_for_visit} />
            )}

            {/* Diagnosis */}
            {appointment.appSummaryV1_2.diagnosis && (
              <DiagnosisSection diagnosis={appointment.appSummaryV1_2.diagnosis} />
            )}

            {/* Action Items (Todos) */}
            {appointment.appSummaryV1_2.todos && (
              <TodosSection todos={appointment.appSummaryV1_2.todos} />
            )}

            {/* Follow-up */}
            {appointment.appSummaryV1_2.follow_up && (
              <FollowUpSection followUp={appointment.appSummaryV1_2.follow_up} />
            )}

            {/* Key Learnings */}
            {appointment.appSummaryV1_2.learnings && (
              <LearningsSection learnings={appointment.appSummaryV1_2.learnings} />
            )}
          </>
        ) : (
          <>
            {/* Original format for regular appointments */}
            {/* Assessment Section - Collapsible */}
            {appointment.ProcessedSummary?.Assessment && (
              <details className="bg-white rounded-lg shadow-sm border border-gray-200" open>
                <summary className="p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                  <h2 className="text-lg inline">Assessment</h2>
                </summary>
                <div className="px-6 pb-6">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {typeof appointment.ProcessedSummary.Assessment === 'string' 
                      ? appointment.ProcessedSummary.Assessment 
                      : JSON.stringify(appointment.ProcessedSummary.Assessment, null, 2)}
                  </div>
                </div>
              </details>
            )}

            {/* Plan Section - Multiple Cards */}
            {appointment.ProcessedSummary?.Plan && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Plan</h2>
                {(() => {
                  const plan = appointment.ProcessedSummary.Plan;
                  
                  // If Plan is a string, split by newlines or display as single card
                  if (typeof plan === 'string') {
                    const planItems = plan.split('\n').filter((item: string) => item.trim());
                    return planItems.map((item: string, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="text-gray-800">{item}</p>
                      </div>
                    ));
                  }
                  
                  // If Plan is an object, display each key-value pair as a card
                  if (typeof plan === 'object' && plan !== null) {
                    return Object.entries(plan).map(([key, value], index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <p className="font-semibold text-gray-900 mb-1">{key}</p>
                        <p className="text-gray-800">{String(value)}</p>
                      </div>
                    ));
                  }
                  
                  // Fallback
                  return (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-gray-800">{JSON.stringify(plan)}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}

        {/* Documents Section */}
        <DocumentsUpload 
          savedDocs={savedDocs} 
          onSavedDocsChange={setSavedDocs} 
        />

        {/* Delete Button - Only show for non-mock appointments */}
        {appointment.appointmentId !== "mock-appointment-v1-2" && (
          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            <span>Delete Appointment</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Appointment?</h3>
            <p className="text-gray-600 mb-6">
              This will permanently delete this appointment and all associated recordings. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
