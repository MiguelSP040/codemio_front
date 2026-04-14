import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* --- Layouts --- */
import MainLayout from '../components/layout/MainLayout';
import AuthenticatedLayout from '../components/layout/AuthenticatedLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';

/* --- Auth Pages --- */
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';

/* --- App Pages --- */
import DashboardHomePage from '../modules/dashboard/pages/DashboardHomePage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import ProjectsPage from '../modules/dashboard/pages/ProjectsPage';
export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — Navbar + Footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes — Sidebar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardHomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
