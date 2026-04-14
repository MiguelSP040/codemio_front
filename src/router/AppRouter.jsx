import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* --- Layouts --- */
import MainLayout from '../components/layout/MainLayout';

/* --- Auth Pages --- */
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage';
import CreatePasswordPage from '../modules/auth/pages/CreatePasswordPage';
import OnboardingPage from '../modules/auth/pages/OnboardingPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';

/* --- App Pages --- */
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import ProjectsPage from '../modules/dashboard/pages/ProjectsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes (sin navbar/footer) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* App routes with shared navbar/footer */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
