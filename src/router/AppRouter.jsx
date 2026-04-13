import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* --- Layouts --- */
import MainLayout from '../components/layout/MainLayout';

/* --- Pages --- */
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import DashboardPage from '../modules/dashboard/pages/DashboardPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard route (pending protected route) */}
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* <Route path="/register" element={<RegisterPage />} /> */}

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
