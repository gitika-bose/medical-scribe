import { createBrowserRouter } from "react-router";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { LoginPage } from "@/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { AppointmentDetailPage } from "@/pages/AppointmentDetailPage";
import { AppointmentErrorPage } from "@/pages/AppointmentErrorPage";
import { AppointmentMetadataPage } from "@/pages/AppointmentMetadataPage";
import { GuestHomePage } from "@/pages/GuestHomePage";
import { GuestAppointmentsPage } from "@/pages/GuestAppointmentsPage";
import { GuestAppointmentDetailPage } from "@/pages/GuestAppointmentDetailPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: OnboardingPage,
  },
  {
    path: "/login",
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
    path: "/appointment-metadata",
    element: (
      <ProtectedRoute>
        <AppointmentMetadataPage />
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
  {
    path: "/appointments/:id/error",
    element: (
      <ProtectedRoute>
        <AppointmentErrorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/guest/home",
    Component: GuestHomePage,
  },
  {
    path: "/guest/appointments",
    Component: GuestAppointmentsPage,
  },
  {
    path: "/guest/appointments/:id",
    Component: GuestAppointmentDetailPage,
  },
]);
