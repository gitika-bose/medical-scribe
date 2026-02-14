import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { analyticsEvents } from "@/lib/firebase";

export default function App() {
  // Log app open event when the app mounts
  useEffect(() => {
    analyticsEvents.appOpen();
  }, []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
