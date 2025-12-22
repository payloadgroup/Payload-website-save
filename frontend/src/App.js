import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import AdminPanel from "@/pages/AdminPanel";
import AdminManagement from "@/pages/AdminManagement";
import Analytics from "@/pages/Analytics";
import HeadquartersPage from "@/pages/HeadquartersPage";
import ProfilePage from "@/pages/ProfilePage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ReferralsPage from "@/pages/ReferralsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import WorkZonePage from "@/pages/WorkZonePage";
import GuaranteedFlipsPage from "@/pages/GuaranteedFlipsPage";
import IconDemoPage from "@/pages/IconDemoPage";
import MemberProgressPage from "@/pages/MemberProgressPage";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-payload-bg flex items-center justify-center">
        <div className="font-mono text-payload-neon animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/icons" element={<IconDemoPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/management"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/member-progress"
              element={
                <ProtectedRoute adminOnly={true}>
                  <MemberProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/member-progress/:memberId"
              element={
                <ProtectedRoute adminOnly={true}>
                  <MemberProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/headquarters"
              element={
                <ProtectedRoute>
                  <HeadquartersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/referrals"
              element={
                <ProtectedRoute>
                  <ReferralsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute adminOnly={true}>
                  <NotificationSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workzone"
              element={
                <ProtectedRoute>
                  <WorkZonePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guaranteed-flips"
              element={
                <ProtectedRoute>
                  <GuaranteedFlipsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" />
      </div>
    </AuthProvider>
  );
}

export default App;