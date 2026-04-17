import { createContext, useContext, useEffect, useState } from 'react';
import { clearSession, readSession, saveSessionFromAuthPayload } from '../modules/auth/services/sessionService';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const parsed = readSession();
    if (!parsed) return { user: null, token: null, refreshToken: null };
    return {
      user: parsed?.user || parsed?.usuario || null,
      token: parsed?.token || parsed?.accessToken || parsed?.tokens?.access_token || null,
      refreshToken: parsed?.refreshToken || parsed?.tokens?.refresh_token || null,
    };
  });

  function loginAuth(data) {
    /* Support both backend shape ({ tokens, usuario }) and flat shape ({ token, user }) */
    const token = data?.tokens?.access_token || data?.token || null;
    const refreshToken = data?.tokens?.refresh_token || data?.refreshToken || null;
    const user = data?.usuario || data?.user || null;

    const next = { user, token, refreshToken };
    setAuth(next);
    saveSessionFromAuthPayload(data);
  }

  function logout() {
    setAuth({ user: null, token: null, refreshToken: null });
    clearSession();
  }

  useEffect(() => {
    function handleAuthExpired() {
      setAuth({ user: null, token: null, refreshToken: null });
      clearSession();
    }
    window.addEventListener('codemio:auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('codemio:auth-expired', handleAuthExpired);
    };
  }, []);

  const isAuthenticated = !!auth.token;

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated, loginAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
