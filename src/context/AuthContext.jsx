import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearSession,
  readSession,
  saveSessionFromAuthPayload,
  setSessionUser,
} from '../modules/auth/services/sessionService';
import toast from '../utils/toast';

const AuthContext = createContext(null);

function stateFromSession() {
  const session = readSession();
  if (!session) return { user: null, token: null, refreshToken: null };
  return {
    user: session.user || null,
    token: session.accessToken || session.token || null,
    refreshToken: session.refreshToken || null,
  };
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(stateFromSession);

  useEffect(() => {
    const win = globalThis.window;
    if (!win) return undefined;
    function handleExpired() {
      clearSession();
      setAuth({ user: null, token: null, refreshToken: null });
      toast.error('Tu sesión expiró, inicia sesión de nuevo', { id: 'session-expired' });
    }
    win.addEventListener('codemio:auth-expired', handleExpired);
    return () => win.removeEventListener('codemio:auth-expired', handleExpired);
  }, []);

  function loginAuth(data) {
    saveSessionFromAuthPayload(data);
    setAuth(stateFromSession());
  }

  function setUser(nextUser) {
    setSessionUser(nextUser);
    setAuth((prev) => ({ ...prev, user: nextUser }));
  }

  function logout() {
    clearSession();
    setAuth({ user: null, token: null, refreshToken: null });
  }

  const isAuthenticated = Boolean(auth.token);
  const onboardingCompleted = auth.user?.onboarding_completed === true;
  const contextValue = useMemo(
    () => ({ ...auth, isAuthenticated, onboardingCompleted, loginAuth, logout, setUser }),
    [auth, isAuthenticated, onboardingCompleted],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
