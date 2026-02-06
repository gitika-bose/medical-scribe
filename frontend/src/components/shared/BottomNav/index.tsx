import { useNavigate, useLocation } from "react-router";
import { Home, Calendar, User } from "lucide-react";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around py-4 max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/home")}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            location.pathname === "/home"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-sm">Home</span>
        </button>
        
        <button
          onClick={() => navigate("/appointments")}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            location.pathname === "/appointments"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar className="w-6 h-6" />
          <span className="text-sm">Appointments</span>
        </button>
        
        <button
          onClick={() => navigate("/home")}
          className={`flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
            location.pathname === "/account"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-sm">Account</span>
        </button>
      </div>
    </div>
  );
}
