import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* --- Layouts --- */
import MainLayout from '../components/layout/MainLayout';

/* --- Pages --- */
import LoginPage from '../modules/auth/pages/LoginPage';
import RegisterPage from '../modules/auth/pages/RegisterPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';
import ProjectsPage from '../modules/dashboard/pages/ProjectsPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* App routes with shared navbar/footer */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
        </Route>

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
