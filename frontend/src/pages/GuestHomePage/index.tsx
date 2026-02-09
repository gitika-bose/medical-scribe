import { useNavigate } from "react-router";
import { Mic } from "lucide-react";
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

export function GuestHomePage() {
  const navigate = useNavigate();
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const handleRecordingClick = () => {
    setShowSignInDialog(true);
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Juno</h1>
          <button
            onClick={handleSignIn}
            className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm">Sign in</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Recording Button */}
          <div className="flex flex-col items-center gap-6 mb-12">
            <div className="relative">
              <button
                onClick={handleRecordingClick}
                className="rounded-full flex items-center justify-center transition-all duration-500 ease-in-out shadow-lg w-36 h-36 hover:scale-105 bg-red-700 hover:bg-red-900"
                aria-label="Start Recording"
              >
                <Mic className="w-16 h-16 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center justify-around py-4 max-w-2xl mx-auto">
          <button
            className="flex flex-col items-center gap-1 px-6 py-2 transition-colors text-blue-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          
          <button
            onClick={() => navigate("/guest/appointments")}
            className="flex flex-col items-center gap-1 px-6 py-2 transition-colors text-gray-600 hover:text-gray-900"
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
              You need to sign in to start recording appointments and access all features.
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
