import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* --- Layouts --- */
import MainLayout from '../components/layout/MainLayout';

/* --- Pages --- */
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';

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
