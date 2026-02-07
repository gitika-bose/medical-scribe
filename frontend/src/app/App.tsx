import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
