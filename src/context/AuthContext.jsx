import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = 'codemio_auth';
const LEGACY_AUTH_STORAGE_KEY = 'auth';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
    if (!stored) return { user: null, token: null, refreshToken: null };
    try {
      const parsed = JSON.parse(stored);
      return {
        user: parsed?.user || parsed?.usuario || null,
        token: parsed?.token || parsed?.accessToken || parsed?.tokens?.access_token || null,
        refreshToken: parsed?.refreshToken || parsed?.tokens?.refresh_token || null,
      };
    } catch {
      return { user: null, token: null, refreshToken: null };
    }
  });

  function loginAuth(data) {
    /* Support both backend shape ({ tokens, usuario }) and flat shape ({ token, user }) */
    const token = data?.tokens?.access_token || data?.token || null;
    const refreshToken = data?.tokens?.refresh_token || data?.refreshToken || null;
    const user = data?.usuario || data?.user || null;

    const next = { user, token, refreshToken };
    setAuth(next);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user,
        accessToken: token,
        refreshToken,
        tokenType: data?.tokens?.token_type || 'Bearer',
      }),
    );
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  }

  function logout() {
    setAuth({ user: null, token: null, refreshToken: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  }

  const isAuthenticated = !!auth.token;

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated, loginAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
