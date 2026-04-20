const AUTH_STORAGE_KEY = 'codemio_auth';
const LEGACY_AUTH_STORAGE_KEY = 'auth';

export function readSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  const session = readSession();
  return session?.accessToken || session?.token || session?.tokens?.access_token || null;
}

export function getRefreshToken() {
  const session = readSession();
  return session?.refreshToken || session?.tokens?.refresh_token || null;
}

export function getSessionEmail() {
  const session = readSession();
  return session?.user?.correo || session?.user?.email || session?.email || null;
}

export function saveSessionFromAuthPayload(payload) {
  const tokens = payload?.tokens || {};
  if (!tokens?.access_token && !payload?.token) return;
  const accessToken = tokens.access_token || payload.token;
  const refreshToken = tokens.refresh_token || payload.refreshToken || null;
  const user = payload?.usuario || payload?.user || null;
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user,
      accessToken,
      refreshToken,
      tokenType: tokens.token_type || payload?.tokenType || 'Bearer',
      expiresIn: tokens.expires_in ?? payload?.expiresIn ?? null,
      email: user?.correo || user?.email || null,
    }),
  );
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
}

export function updateTokens({ accessToken, refreshToken }) {
  const current = readSession() || {};
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...current,
      accessToken: accessToken || current?.accessToken || null,
      refreshToken: refreshToken ?? current?.refreshToken ?? null,
      token: undefined,
      tokens: undefined,
    }),
  );
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
}
