import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { AuthProvider, useAuth } from '../context/AuthContext';
import {
  setAccessTokenGetter,
  setRefreshTokenGetter,
  setRefreshEmailGetter,
  attachAuthHandlers,
} from '../config/httpClient';
import toast from '../utils/toast';

/* --- Layouts --- */
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout';
import AdminRoute from '../components/layout/AdminRoute';
import ProtectedRoute from '../components/layout/ProtectedRoute';

/* --- Auth Pages --- */
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage';
import CreatePasswordPage from '../modules/auth/pages/CreatePasswordPage';
import OnboardingPage from '../modules/auth/pages/OnboardingPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../modules/auth/pages/ResetPasswordPage';

/* --- App Pages --- */
import DashboardHomePage from '../modules/dashboard/pages/DashboardHomePage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import ProjectsPage from '../modules/dashboard/pages/ProjectsPage';
import AnalysisRunsPage from '../modules/analysis/pages/AnalysisRunsPage';

/* --- Admin Pages --- */
import AdminUsersListPage from '../modules/adminUsers/pages/AdminUsersListPage';
import AdminUserDetailPage from '../modules/adminUsers/pages/AdminUserDetailPage';

function AuthBinder() {
  const {
    getAccessToken,
    getRefreshToken,
    getRefreshEmail,
    clearAuth,
    applyRefreshedTokens,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setAccessTokenGetter(getAccessToken);
    setRefreshTokenGetter(getRefreshToken);
    setRefreshEmailGetter(getRefreshEmail);
    attachAuthHandlers({
      onRefreshSuccess: (tokens) => applyRefreshedTokens(tokens),
      onSessionExpired: () => {
        clearAuth();
        toast.error('Tu sesión expiró, inicia sesión de nuevo', { id: 'session-expired' });
        navigate('/login', { replace: true });
      },
    });
  }, [getAccessToken, getRefreshToken, getRefreshEmail, clearAuth, applyRefreshedTokens, navigate]);

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthBinder />
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Auth routes (standalone, no layout wrapper) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/create-password" element={<CreatePasswordPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes — Sidebar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/analysis" element={<AnalysisRunsPage />} />
            <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />

              {/* Admin-only */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<AdminUsersListPage />} />
                <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
