import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, ChevronLeft } from "lucide-react";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (hasSeenOnboarding === "true") {
      navigate("/login");
    }
  }, [navigate]);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentPage < 2) {
      handleNext();
    }
    if (isRightSwipe && currentPage > 0) {
      handlePrevious();
    }
  };

  const handleNext = () => {
    if (currentPage < 2) {
      setCurrentPage(currentPage + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    navigate("/login");
  };

  return (
    <div 
      className="min-h-screen bg-white flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Page 0: Welcome */}
          {currentPage === 0 && (
            <div className="text-center animate-in fade-in slide-in-from-right duration-500">
              <img 
                src="/logo/android-chrome-512x512.png" 
                alt="Juno Logo" 
                className="w-64 h-64 mx-auto mb-8"
              />
              <h1 className="text-4xl font-bold mb-4">Meet Juno</h1>
              <p className="text-gray-600 text-xl">
                Your privacy first companion for medical appointments
              </p>
            </div>
          )}

          {/* Page 1: Features */}
          {currentPage === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-right duration-500">
              <div className="mb-8">
                {/* Medical clipart - using a simple SVG illustration */}
                <svg 
                  className="w-64 h-64 mx-auto" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Stethoscope illustration */}
                  <circle cx="100" cy="100" r="80" fill="#e3eef5" />
                  <path 
                    d="M70 60 Q70 40, 90 40 L110 40 Q130 40, 130 60 L130 100 Q130 120, 110 120 L90 120 Q70 120, 70 100 Z" 
                    fill="#63a2ca" 
                  />
                  <circle cx="100" cy="140" r="20" fill="#326e94" />
                  <path 
                    d="M80 140 Q80 160, 100 160 Q120 160, 120 140" 
                    stroke="#326e94" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <circle cx="60" cy="80" r="12" fill="#db7f67" />
                  <circle cx="140" cy="80" r="12" fill="#db7f67" />
                  <path 
                    d="M60 80 L40 60 M140 80 L160 60" 
                    stroke="#db7f67" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed px-4">
                With your privacy at the forefront, Juno will listen in your appointments, 
                take meticulous notes, generate questions for your doctor, and support you 
                through your medical journey
              </p>
            </div>
          )}

          {/* Page 2: Login */}
          {currentPage === 2 && (
            <div className="text-center animate-in fade-in slide-in-from-right duration-500">
              <img 
                src="/logo/android-chrome-512x512.png" 
                alt="Juno Logo" 
                className="w-48 h-48 mx-auto mb-6"
              />
              <h2 className="text-2xl font-semibold mb-8">Ready to get started?</h2>
              <button
                onClick={handleSkip}
                className="w-full bg-primary text-white rounded-full py-4 px-6 hover:bg-gray-800 transition-colors text-lg font-medium"
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-4">
            {/* Back Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`transition-colors ${
                currentPage === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-primary hover:text-gray-800"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            {/* Page Indicators */}
            <div className="flex gap-2">
              {[0, 1, 2].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentPage === page 
                      ? "w-8 bg-primary" 
                      : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to page ${page + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="text-primary hover:text-gray-800 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Skip Button - replaces swipe hint */}
          {currentPage < 2 && (
            <div className="text-center">
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors text-xs"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
