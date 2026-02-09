import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { format } from "date-fns";
import {
  SummarySection,
  ReasonForVisitSection,
  DiagnosisSection,
  TodosSection,
  FollowUpSection,
  LearningsSection,
} from "@/components/pages/AppointmentDetailPage";

// Mock appointment data
const mockAppointmentData: Record<string, any> = {
  "guest-1": {
    appointmentId: "guest-1",
    appointmentDate: "2026-02-05T10:30:00",
    title: "Orthopedic Consultation for Meniscus Tear",
    doctor: "",
    processedSummary: {
      summary: "The doctor discussed the patient's discoid meniscus tear, explaining that it is likely not repairable and would involve arthroscopic excision and reshaping. Recovery is expected to be 4-6 weeks, with a high chance of substantial improvement. Risks are low.",
      reason_for_visit: [
        {
          reason: "Meniscus issue",
          description: "The patient has a discoid meniscus with a tear, causing pain and requiring intervention. The patient is seeking a surgical consultation."
        }
      ],
      diagnosis: {
        details: [
          {
            title: "Discoid Meniscus Tear",
            description: "The patient has a predisposition to a discoid meniscus, meaning there is less 'carve out' and more meniscus tissue than normal. This makes it more prone to tearing and delamination. The tear is described as 'crabby' and generally not repairable.",
            severity: "high"
          }
        ]
      },
      todos: [
        {
          type: "procedure",
          title: "Arthroscopic Meniscus Excision and Reshaping",
          description: "Surgical procedure to remove torn meniscus tissue and reshape the remaining meniscus",
          timeframe: "Within 3-4 weeks",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Post-operative Recovery",
          description: "Can walk on knee immediately after surgery if excision is performed",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Recovery Timeline",
          description: "Recovery typically takes 4 to 6 weeks",
          recommended: true,
          verified: true
        }
      ],
      follow_up: [
        {
          description: "Schedule surgery within 3-4 weeks",
          time_frame: "3-4 weeks"
        },
        {
          description: "Follow post-operative care protocols",
          time_frame: "After surgery"
        }
      ],
      learnings: [
        {
          title: "Discoid Meniscus",
          description: "A condition where the meniscus has an abnormal shape with less 'carve out' and more tissue than normal"
        },
        {
          title: "Meniscus Excision vs. Repair",
          description: "Excision involves removing the torn portion and reshaping. Repair is preferred if possible but often not feasible for discoid menisci"
        },
        {
          title: "Surgical Risks",
          description: "Low risk (approximately 1%) including infection, blood clot, or anesthetic complications"
        }
      ],
    },
  },
  "guest-2": {
    appointmentId: "guest-2",
    appointmentDate: "2026-01-28T14:00:00",
    title: "Emergency Department Visit - Sudden Paralysis",
    doctor: "Dr. Sarah Chen",
    processedSummary: {
      summary: "Patient presented to ED with sudden onset of right-sided weakness and facial droop. CT scan revealed acute ischemic stroke in left middle cerebral artery territory. Patient received IV tPA within therapeutic window. Neurological deficits improved significantly post-treatment. Admitted for stroke workup and rehabilitation.",
      reason_for_visit: [
        {
          reason: "Sudden right-sided weakness and facial droop",
          description: "Patient experienced sudden onset of right arm and leg weakness with right facial droop while at home. Family noticed slurred speech and called 911 immediately."
        }
      ],
      diagnosis: {
        details: [
          {
            title: "Acute Ischemic Stroke",
            description: "Left middle cerebral artery (MCA) territory infarction confirmed by CT imaging. Patient presented within 3-hour window for thrombolytic therapy.",
            severity: "high"
          },
          {
            title: "Hypertension",
            description: "Uncontrolled hypertension identified as major risk factor. Blood pressure 180/95 on admission.",
            severity: "high"
          }
        ]
      },
      todos: [
        {
          type: "medication",
          title: "Aspirin 325mg daily",
          description: "Antiplatelet therapy for secondary stroke prevention",
          dosage: "325mg",
          frequency: "Once daily",
          timing: "Morning with food",
          duration: "Ongoing",
          recommended: true,
          verified: true
        },
        {
          type: "medication",
          title: "Atorvastatin 80mg",
          description: "High-intensity statin therapy for cholesterol management and stroke prevention",
          dosage: "80mg",
          frequency: "Once daily",
          timing: "Evening",
          duration: "Ongoing",
          recommended: true,
          verified: true
        },
        {
          type: "medication",
          title: "Lisinopril 10mg",
          description: "ACE inhibitor for blood pressure control",
          dosage: "10mg",
          frequency: "Once daily",
          timing: "Morning",
          duration: "Ongoing",
          recommended: true,
          verified: true
        },
        {
          type: "test",
          title: "Carotid Doppler Ultrasound",
          description: "Evaluate for carotid artery stenosis as potential stroke etiology",
          timeframe: "Within 48 hours",
          recommended: true,
          verified: true
        },
        {
          type: "test",
          title: "Echocardiogram",
          description: "Assess for cardiac source of embolism",
          timeframe: "Within 72 hours",
          recommended: true,
          verified: true
        },
        {
          type: "procedure",
          title: "Physical and Occupational Therapy",
          description: "Intensive rehabilitation for right-sided weakness and functional recovery",
          timeframe: "Daily during admission, continue outpatient",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Blood pressure monitoring",
          description: "Monitor BP closely and adjust medications to maintain target <140/90",
          recommended: true,
          verified: true
        }
      ],
      follow_up: [
        {
          description: "Neurology follow-up appointment",
          time_frame: "2 weeks post-discharge"
        },
        {
          description: "Primary care follow-up for medication management",
          time_frame: "1 week post-discharge"
        },
        {
          description: "Continue outpatient physical and occupational therapy",
          time_frame: "3 times per week for 8-12 weeks"
        }
      ],
      learnings: [
        {
          title: "FAST Stroke Recognition",
          description: "Face drooping, Arm weakness, Speech difficulty, Time to call 911. Early recognition and treatment within 3-4.5 hours can significantly improve outcomes."
        },
        {
          title: "Importance of Blood Pressure Control",
          description: "Uncontrolled hypertension is the leading modifiable risk factor for stroke. Target BP <140/90 for most patients, <130/80 for high-risk individuals."
        },
        {
          title: "Secondary Stroke Prevention",
          description: "Combination of antiplatelet therapy, statin, and blood pressure control reduces recurrent stroke risk by up to 80%."
        },
        {
          title: "Rehabilitation and Recovery",
          description: "Early intensive rehabilitation is crucial for functional recovery. Most recovery occurs in first 3-6 months, but improvements can continue for up to 2 years."
        }
      ],
    },
  },
  "guest-3": {
    appointmentId: "guest-3",
    appointmentDate: "2026-01-15T09:00:00",
    title: "Primary Care Visit - Bilateral Leg Swelling",
    doctor: "Dr. Michael Rodriguez",
    processedSummary: {
      summary: "Patient presented with progressive bilateral lower extremity edema over 3 weeks. Physical exam revealed 3+ pitting edema to mid-calf bilaterally. Labs showed elevated BNP and mild hypoalbuminemia. Echocardiogram revealed reduced ejection fraction of 35%, consistent with heart failure. Started on diuretic therapy with good initial response. Referred to cardiology for heart failure management.",
      reason_for_visit: [
        {
          reason: "Bilateral leg swelling",
          description: "Patient reports progressive swelling of both legs over the past 3 weeks, worse at end of day. Also experiencing increased shortness of breath with exertion and difficulty sleeping flat."
        }
      ],
      diagnosis: {
        details: [
          {
            title: "Congestive Heart Failure (CHF)",
            description: "New diagnosis of heart failure with reduced ejection fraction (HFrEF). Echocardiogram shows EF 35%. Elevated BNP 850 pg/mL confirms diagnosis.",
            severity: "high"
          },
          {
            title: "Hypoalbuminemia",
            description: "Serum albumin 2.8 g/dL (low), contributing to edema. May indicate nutritional deficiency or protein loss.",
            severity: "medium"
          },
          {
            title: "Chronic Venous Insufficiency",
            description: "Bilateral lower extremity edema with skin changes suggestive of chronic venous disease, exacerbated by heart failure.",
            severity: "medium"
          }
        ]
      },
      todos: [
        {
          type: "medication",
          title: "Furosemide 40mg",
          description: "Loop diuretic to reduce fluid overload and edema",
          dosage: "40mg",
          frequency: "Once daily",
          timing: "Morning",
          duration: "Ongoing, may adjust dose",
          recommended: true,
          verified: true
        },
        {
          type: "medication",
          title: "Lisinopril 5mg",
          description: "ACE inhibitor for heart failure management and blood pressure control",
          dosage: "5mg",
          frequency: "Once daily",
          timing: "Morning",
          duration: "Ongoing, titrate up as tolerated",
          recommended: true,
          verified: true
        },
        {
          type: "medication",
          title: "Carvedilol 3.125mg",
          description: "Beta-blocker for heart failure management",
          dosage: "3.125mg",
          frequency: "Twice daily",
          timing: "Morning and evening with food",
          duration: "Ongoing, titrate up as tolerated",
          recommended: true,
          verified: true
        },
        {
          type: "test",
          title: "Repeat BMP and renal function",
          description: "Monitor electrolytes and kidney function while on diuretic therapy",
          timeframe: "1 week",
          recommended: true,
          verified: true
        },
        {
          type: "test",
          title: "Repeat echocardiogram",
          description: "Reassess cardiac function after medication optimization",
          timeframe: "3 months",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Daily weight monitoring",
          description: "Weigh yourself every morning and call if weight increases >3 lbs in 1 day or >5 lbs in 1 week",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Sodium restriction",
          description: "Limit sodium intake to <2000mg per day to help manage fluid retention",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Leg elevation",
          description: "Elevate legs above heart level for 30 minutes 3-4 times daily to reduce swelling",
          recommended: true,
          verified: true
        },
        {
          type: "other",
          title: "Compression stockings",
          description: "Wear 20-30 mmHg compression stockings during daytime to help manage venous insufficiency",
          recommended: true,
          verified: true
        }
      ],
      follow_up: [
        {
          description: "Cardiology consultation for heart failure management",
          time_frame: "2 weeks"
        },
        {
          description: "Primary care follow-up to assess diuretic response and medication tolerance",
          time_frame: "1 week"
        },
        {
          description: "Nutrition consultation for low-sodium diet education",
          time_frame: "2-3 weeks"
        }
      ],
      learnings: [
        {
          title: "Heart Failure Symptoms",
          description: "Classic signs include shortness of breath, leg swelling, fatigue, and difficulty lying flat (orthopnea). Early recognition and treatment can prevent hospitalization."
        },
        {
          title: "Importance of Daily Weights",
          description: "Daily weight monitoring is crucial for heart failure patients. Sudden weight gain indicates fluid retention and may require medication adjustment before symptoms worsen."
        },
        {
          title: "Sodium and Fluid Management",
          description: "Limiting sodium to <2000mg/day and monitoring fluid intake helps reduce fluid retention. Reading food labels and avoiding processed foods is essential."
        },
        {
          title: "Medication Adherence in Heart Failure",
          description: "Taking medications as prescribed (ACE inhibitor, beta-blocker, diuretic) can improve symptoms, reduce hospitalizations, and prolong life. Medications are typically started at low doses and gradually increased."
        },
        {
          title: "When to Seek Emergency Care",
          description: "Call 911 for severe shortness of breath, chest pain, or inability to lie flat. Contact doctor for weight gain >3 lbs in 1 day, increased swelling, or worsening symptoms."
        }
      ],
    },
  },
};

export function GuestAppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const appointment = id ? mockAppointmentData[id] : null;

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Appointment not found</p>
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
            onClick={() => navigate("/guest/appointments")}
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

        {/* Delete Button - Shows dialog */}
        <button
          onClick={() => setShowSignInDialog(true)}
          className="w-full bg-red-600 text-white rounded-lg py-3 px-6 hover:bg-red-700 transition-colors"
        >
          Delete Appointment
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-around py-4 max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/guest/home")}
            className="flex flex-col items-center gap-1 px-6 py-2 transition-colors text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          
          <button
            onClick={() => navigate("/guest/appointments")}
            className="flex flex-col items-center gap-1 px-6 py-2 transition-colors text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Appointments</span>
          </button>
        </div>
      </div>

      {/* Sign In Dialog */}
      <AlertDialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in to try this feature</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to delete appointments and access all features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button
              onClick={() => setShowSignInDialog(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <AlertDialogAction onClick={() => navigate("/login")}>
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
