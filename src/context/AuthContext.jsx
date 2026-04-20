import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem('auth');
    return stored ? JSON.parse(stored) : { user: null, token: null, refreshToken: null };
  });

  function loginAuth(data) {
    /* Support both backend shape ({ tokens, usuario }) and flat shape ({ token, user }) */
    const token = data?.tokens?.access_token || data?.token || null;
    const refreshToken = data?.tokens?.refresh_token || data?.refreshToken || null;
    const user = data?.usuario || data?.user || null;

    const next = { user, token, refreshToken };
    setAuth(next);
    localStorage.setItem('auth', JSON.stringify(next));
  }

  function setUser(nextUser) {
    setAuth((prev) => {
      const next = { ...prev, user: nextUser };
      localStorage.setItem('auth', JSON.stringify(next));
      /* Mirror the updated user into the `codemio_auth` session so modules
         reading via sessionService/apiClient see refreshed flags (e.g. onboarding_completed). */
      try {
        const rawCodemio = localStorage.getItem('codemio_auth');
        if (rawCodemio) {
          const parsed = JSON.parse(rawCodemio);
          localStorage.setItem(
            'codemio_auth',
            JSON.stringify({ ...parsed, user: nextUser }),
          );
        }
      } catch {
        /* Secondary mirror is best-effort — primary store is the `auth` key. */
      }
      return next;
    });
  }

  function logout() {
    setAuth({ user: null, token: null, refreshToken: null });
    localStorage.removeItem('auth');
  }

  const isAuthenticated = !!auth.token;
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
