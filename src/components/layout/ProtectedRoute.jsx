import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const loginTarget = `/login${location.search || ''}`;
    return <Navigate to={loginTarget} replace />;
  }

  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
