import { createBrowserRouter } from "react-router";
import { LoginPage } from "@/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { AppointmentDetailPage } from "@/pages/AppointmentDetailPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/listening",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/appointments",
    element: (
      <ProtectedRoute>
        <AppointmentsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/appointments/:id",
    element: (
      <ProtectedRoute>
        <AppointmentDetailPage />
      </ProtectedRoute>
    ),
  },
]);
