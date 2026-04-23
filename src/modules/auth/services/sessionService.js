const AUTH_STORAGE_KEY = 'codemio_auth';
const LEGACY_AUTH_STORAGE_KEY = 'auth';

function safeString(value, maxLength = 255) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function safeNullableNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    correo: safeString(user.correo || user.email),
    rol: safeString(user.rol || user.role, 50),
    nombre: safeString(user.nombre || user.name),
    edad: safeNullableNumber(user.edad),
    perfil_github: safeString(user.perfil_github, 255),
    sub_cognito: safeString(user.sub_cognito || user.sub, 128),
    onboarding_completed: user.onboarding_completed === true,
  };
}

function sanitizeSocialClaims(claims) {
  if (!claims || typeof claims !== 'object') return null;
  return {
    email: safeString(claims.email),
    email_verified: claims.email_verified === true,
    name: safeString(claims.name),
    picture: safeString(claims.picture, 1024),
    sub: safeString(claims.sub, 128),
  };
}

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
  if (!tokens?.access_token && !payload?.token && !payload?.usuario && !payload?.user) return;
  const accessToken = tokens.access_token || payload.token;
  const refreshToken = tokens.refresh_token || payload.refreshToken || null;
  const user = sanitizeUser(payload?.usuario || payload?.user);
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

export function saveSocialSession({ usuario, claims }) {
  const safeUser = sanitizeUser(usuario);
  const safeClaims = sanitizeSocialClaims(claims);
  return {
    user: safeUser,
    accessToken: null,
    refreshToken: null,
    tokenType: 'Bearer',
    expiresIn: null,
    email: safeUser?.correo || safeClaims?.email || null,
    socialClaims: safeClaims,
  };
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

export function setSessionUser(user) {
  const current = readSession();
  if (!current) return;
  const safeUser = sanitizeUser(user);
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      ...current,
      user: safeUser,
      email: safeUser?.correo || current.email || null,
    }),
  );
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
}
