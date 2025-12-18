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
              path="/headquarters"
              element={
                <ProtectedRoute>
                  <HeadquartersPage />
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