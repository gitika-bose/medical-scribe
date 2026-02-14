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
                {/* Minimal note-taking illustration */}
                <svg 
                  className="w-64 h-64 mx-auto" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Soft background circle */}
                  <circle cx="100" cy="100" r="85" fill="#f0f4f8" />
                  
                  {/* Notepad/paper */}
                  <rect x="60" y="45" width="80" height="110" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="2" />
                  
                  {/* Spiral binding holes */}
                  <circle cx="70" cy="50" r="2.5" fill="#cbd5e1" />
                  <circle cx="85" cy="50" r="2.5" fill="#cbd5e1" />
                  <circle cx="100" cy="50" r="2.5" fill="#cbd5e1" />
                  <circle cx="115" cy="50" r="2.5" fill="#cbd5e1" />
                  <circle cx="130" cy="50" r="2.5" fill="#cbd5e1" />
                  
                  {/* Note lines */}
                  <line x1="70" y1="70" x2="110" y2="70" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="70" y1="85" x2="125" y2="85" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  <line x1="70" y1="100" x2="105" y2="100" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  
                  {/* Cute checkmarks */}
                  <path d="M 68 115 L 72 119 L 78 111" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M 68 130 L 72 134 L 78 126" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  
                  {/* Pencil */}
                  <g transform="translate(115, 120) rotate(-45)">
                    <rect x="0" y="0" width="8" height="35" rx="1" fill="#fbbf24" />
                    <polygon points="0,35 4,42 8,35" fill="#f59e0b" />
                    <rect x="0" y="0" width="8" height="6" fill="#fef3c7" />
                    <line x1="4" y1="3" x2="4" y2="3" stroke="#fbbf24" strokeWidth="1" />
                  </g>
                  
                  {/* Small heart accent */}
                  <path d="M 125 65 C 125 63, 127 61, 129 61 C 130 61, 131 62, 131 63 C 131 62, 132 61, 133 61 C 135 61, 137 63, 137 65 C 137 68, 131 72, 131 72 C 131 72, 125 68, 125 65 Z" fill="#f472b6" opacity="0.6" />
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
