import { createContext, useContext, useState } from 'react';

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
    const next = { user: data.user, token: data.token, refreshToken: data.refreshToken || null };
    setAuth(next);
    localStorage.setItem('auth', JSON.stringify(next));
  }

  function logout() {
    setAuth({ user: null, token: null, refreshToken: null });
    localStorage.removeItem('auth');
  }

  const isAuthenticated = !!auth.token;

  return (
    <AuthContext.Provider value={{ ...auth, isAuthenticated, loginAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
