import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { EmergencyButton } from "@/components/emergency-button";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/protected-route";
import Landing from "@/pages/landing";

// Patient
import PatientDashboard from "@/pages/patient/dashboard";
import BookAppointment from "@/pages/patient/book";
import PatientAppointments from "@/pages/patient/appointments";
import PatientReports from "@/pages/patient/reports";
import PatientPrescriptions from "@/pages/patient/prescriptions";
import PatientProfile from "@/pages/patient/profile";

// Doctor
import DoctorDashboard from "@/pages/doctor/dashboard";
import DoctorAvailability from "@/pages/doctor/availability";
import DoctorLeave from "@/pages/doctor/leave";
import DoctorCalendar from "@/pages/doctor/calendar";
import DoctorAnalytics from "@/pages/doctor/analytics";
import DoctorProfile from "@/pages/doctor/profile";
import DoctorAppointmentDetail from "@/pages/doctor/appointment-detail";

// Admin
import AdminDashboard from "@/pages/admin/dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />

      {/* Patient Routes */}
      <Route path="/patient/dashboard">
        <ProtectedRoute allowedRoles={["patient"]}>
          <PatientDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/patient/book">
        <ProtectedRoute allowedRoles={["patient"]}>
          <BookAppointment />
        </ProtectedRoute>
      </Route>
      <Route path="/patient/appointments">
        <ProtectedRoute allowedRoles={["patient"]}>
          <PatientAppointments />
        </ProtectedRoute>
      </Route>
      <Route path="/patient/reports">
        <ProtectedRoute allowedRoles={["patient"]}>
          <PatientReports />
        </ProtectedRoute>
      </Route>
      <Route path="/patient/prescriptions">
        <ProtectedRoute allowedRoles={["patient"]}>
          <PatientPrescriptions />
        </ProtectedRoute>
      </Route>
      <Route path="/patient/profile">
        <ProtectedRoute allowedRoles={["patient"]}>
          <PatientProfile />
        </ProtectedRoute>
      </Route>

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/availability">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorAvailability />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/leave">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorLeave />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/calendar">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorCalendar />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/analytics">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/profile">
        <ProtectedRoute allowedRoles={["doctor"]}>
          <DoctorProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/doctor/appointment/:id">
        {(params) => (
          <ProtectedRoute allowedRoles={["doctor"]}>
            <DoctorAppointmentDetail />
          </ProtectedRoute>
        )}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route>
        <div className="min-h-[100dvh] flex items-center justify-center text-white">
          <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
        </div>
      </Route>
    </Switch>
  );
}

function AppContent() {
  return (
    <AuthProvider>
      <div className="relative min-h-[100dvh] overflow-hidden bg-gradient-to-br from-[#0f4c75] via-[#1b6ca8] to-[#14a085]">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="relative z-10 flex flex-col min-h-[100dvh]">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Router />
          </main>
          <EmergencyButton />
        </div>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
