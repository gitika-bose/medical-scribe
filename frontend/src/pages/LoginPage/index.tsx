import { useNavigate } from "react-router";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { analyticsEvents } from "@/lib/firebase";

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleGmailLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
      
      // Log analytics event for user login
      analyticsEvents.userLogin('google');
      
      // Navigation will happen automatically via useEffect when user state updates
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo and Header - positioned higher */}
        <div className="text-center mb-8">
          <img 
            src="/logo/android-chrome-512x512.png" 
            alt="Juno Logo" 
            className="w-32 h-32 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold mb-3">Welcome to Juno</h1>
          <p className="text-gray-600 text-base">
            Sign in to get started or try it it out as a guest
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {/* Sign in button */}
        <button
          onClick={handleGmailLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 rounded-full py-4 px-6 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          <Mail className="w-5 h-5 text-red-500" />
          <span className="text-gray-900">
            {loading ? "Signing in..." : "Sign in with Gmail"}
          </span>
        </button>

        {/* Try as guest - moved lower with more spacing */}
        <div className="text-center mt-8">
          <button
            onClick={() => {
              analyticsEvents.tryAsGuest();
              navigate("/guest/home");
            }}
            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Try as a guest?
          </button>
        </div>
      </div>
    </div>
  );
}
