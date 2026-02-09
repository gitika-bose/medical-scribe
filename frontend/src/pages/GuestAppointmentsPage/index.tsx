import { useNavigate } from "react-router";
import { ChevronRight, Calendar, Plus, Upload, Mic } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

// Mock appointment data for guest view
const mockAppointments = [
  {
    appointmentId: "guest-1",
    appointmentDate: "2026-02-05T10:30:00",
    title: "Orthopedic Consultation for Meniscus Tear",
    doctor: "",
  },
  {
    appointmentId: "guest-2",
    appointmentDate: "2026-01-28T14:00:00",
    title: "Emergency Department Visit - Sudden Paralysis",
    doctor: "Dr. Sarah Chen",
  },
  {
    appointmentId: "guest-3",
    appointmentDate: "2026-01-15T09:00:00",
    title: "Primary Care Visit - Bilateral Leg Swelling",
    doctor: "Dr. Michael Rodriguez",
  },
];

export function GuestAppointmentsPage() {
  const navigate = useNavigate();
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownItemClick = () => {
    setShowDropdown(false);
    setShowSignInDialog(true);
  };

  const handleAppointmentClick = (appointmentId: string) => {
    navigate(`/guest/appointments/${appointmentId}`);
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  const getAppointmentTitle = (appointment: typeof mockAppointments[0]): string => {
    if (appointment.title) return appointment.title;
    if (appointment.doctor) return appointment.doctor;
    return format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Juno</h1>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>New</span>
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handleDropdownItemClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Mic className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">Live Recording</span>
                </button>
                <button
                  onClick={handleDropdownItemClick}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-900">Upload Recording</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="flex-1 max-w-2xl md:max-w-2xl lg:max-w-2xl w-full mx-auto p-6 overflow-y-auto">
        {mockAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments found</p>
            <p className="text-sm text-gray-500 mt-2">
              Start a recording to create your first appointment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockAppointments.map((appointment) => (
              <button
                key={appointment.appointmentId}
                onClick={() => handleAppointmentClick(appointment.appointmentId)}
                className="w-full rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow border bg-white border-gray-200"
              >
                <div className="flex-1 text-left">
                  <p className="text-sm mb-1 text-gray-500">
                    {format(new Date(appointment.appointmentDate), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p className="line-clamp-2 text-gray-900">
                    {getAppointmentTitle(appointment)}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 ml-4 flex-shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        )}
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
              You need to sign in to create new appointments and access all features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button
              onClick={() => setShowSignInDialog(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <AlertDialogAction onClick={handleSignIn}>
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
