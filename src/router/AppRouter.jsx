import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* --- Pages --- */
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import VerifyEmailPage from '../modules/auth/pages/VerifyEmailPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Dashboard route (pending protected route) */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* TODO: Protected routes */}
        {/* <Route element={<ProtectedRoute />}> */}
        {/*   <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/*   <Route path="/projects" element={<ProjectsPage />} /> */}
        {/*   <Route path="/analysis/:id" element={<AnalysisPage />} /> */}
        {/* </Route> */}
      </Routes>
    </BrowserRouter>
  );
}
