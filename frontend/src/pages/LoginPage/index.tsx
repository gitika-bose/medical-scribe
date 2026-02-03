import { useNavigate } from "react-router";
import { Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

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
      // Navigation will happen automatically via useEffect when user state updates
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleGmailLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 rounded-full py-4 px-6 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Mail className="w-5 h-5 text-red-500" />
          <span className="text-gray-900">
            {loading ? "Signing in..." : "Continue with Gmail"}
          </span>
        </button>
      </div>
    </div>
  );
}
