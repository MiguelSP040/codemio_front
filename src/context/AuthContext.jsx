import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  STORAGE_AUTH,
  migrateLegacyStorage,
  performRefresh,
  performLogout,
} from '../config/httpClient';

migrateLegacyStorage();

function readAuthFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAuthToStorage(next) {
  if (!next || !next.access_token) {
    localStorage.removeItem(STORAGE_AUTH);
    return;
  }
  localStorage.setItem(STORAGE_AUTH, JSON.stringify(next));
}

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => readAuthFromStorage());
  const authStateRef = useRef(authState);

  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  const getAccessToken = useRef(() => authStateRef.current?.access_token ?? null).current;
  const getRefreshToken = useRef(() => authStateRef.current?.refresh_token ?? null).current;
  const getRefreshEmail = useRef(() => authStateRef.current?.usuario?.correo ?? null).current;

  function loginAuth(data) {
    const tokens = data?.tokens ?? {};
    const next = {
      access_token: tokens.access_token ?? data?.access_token ?? data?.token ?? null,
      refresh_token: tokens.refresh_token ?? data?.refresh_token ?? data?.refreshToken ?? null,
      expires_in: tokens.expires_in ?? data?.expires_in ?? null,
      token_type: tokens.token_type ?? data?.token_type ?? 'Bearer',
      id_token: tokens.id_token ?? data?.id_token ?? null,
      usuario: data?.usuario ?? data?.user ?? null,
    };
    if (!next.access_token) return;
    writeAuthToStorage(next);
    setAuthState(next);
  }

  function applyRefreshedTokens(newTokens) {
    const prev = authStateRef.current;
    if (!prev) return;
    const next = {
      ...prev,
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token ?? prev.refresh_token,
      expires_in: newTokens.expires_in ?? prev.expires_in,
      token_type: newTokens.token_type ?? prev.token_type,
      id_token: newTokens.id_token ?? prev.id_token,
      usuario: prev.usuario,
    };
    writeAuthToStorage(next);
    setAuthState(next);
  }

  function setUser(nextUser) {
    const prev = authStateRef.current;
    if (!prev) return;
    const next = { ...prev, usuario: nextUser ?? null };
    writeAuthToStorage(next);
    setAuthState(next);
  }

  function clearAuth() {
    const accessToken = authStateRef.current?.access_token;
    if (accessToken) {
      performLogout(accessToken);
    }
    localStorage.removeItem(STORAGE_AUTH);
    setAuthState(null);
  }

  const logout = clearAuth;

  async function refreshTokens() {
    return performRefresh();
  }

  const user = authState?.usuario ?? null;
  const isAuthenticated = !!authState?.access_token;
  const onboardingCompleted = user?.onboarding_completed === true;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      onboardingCompleted,
      loginAuth,
      logout,
      clearAuth,
      setUser,
      refreshTokens,
      applyRefreshedTokens,
      getAccessToken,
      getRefreshToken,
      getRefreshEmail,
    }),
    // loginAuth, clearAuth, setUser, applyRefreshedTokens are defined inline per render but
    // only their captured closures over refs/setters matter; re-memoizing on state changes is
    // cheap and keeps the value object stable for the current snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, isAuthenticated, onboardingCompleted],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
