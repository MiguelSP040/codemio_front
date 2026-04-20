import axios from 'axios';
import API_BASE_URL from './api';

export const STORAGE_AUTH = 'codemio.auth';

export function migrateLegacyStorage() {
  if (localStorage.getItem(STORAGE_AUTH)) {
    localStorage.removeItem('auth');
    localStorage.removeItem('codemio_auth');
    return;
  }

  const tryParse = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const schemeB = tryParse('codemio_auth');
  const schemeA = tryParse('auth');
  const source = schemeB || schemeA;

  if (source) {
    const next = {
      access_token: source.accessToken || source.token || null,
      refresh_token: source.refreshToken || null,
      expires_in: source.expiresIn ?? null,
      token_type: source.tokenType || 'Bearer',
      id_token: null,
      usuario: source.user || null,
    };
    if (next.access_token) {
      localStorage.setItem(STORAGE_AUTH, JSON.stringify(next));
    }
  }

  localStorage.removeItem('auth');
  localStorage.removeItem('codemio_auth');
}

const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;
let getAccessToken = () => null;
let getRefreshToken = () => null;
let getRefreshEmail = () => null;
let onSessionExpired = null;
let onRefreshSuccess = null;

export function setAccessTokenGetter(fn) {
  if (typeof fn === 'function') getAccessToken = fn;
}

export function setRefreshTokenGetter(fn) {
  if (typeof fn === 'function') getRefreshToken = fn;
}

export function setRefreshEmailGetter(fn) {
  if (typeof fn === 'function') getRefreshEmail = fn;
}

export function attachAuthHandlers({ onSessionExpired: a, onRefreshSuccess: b } = {}) {
  if (typeof a === 'function') onSessionExpired = a;
  if (typeof b === 'function') onRefreshSuccess = b;
}

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers?.Authorization) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }
  return config;
});

export async function performRefresh() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) throw new Error('No refresh token');

  const email = getRefreshEmail();
  if (!email) throw new Error('No refresh email');

  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh/`,
    { refresh_token, email },
    { headers: { 'Content-Type': 'application/json' } },
  );

  const tokens = data?.tokens ?? {};
  const nextTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_in: tokens.expires_in ?? null,
    token_type: tokens.token_type ?? 'Bearer',
    id_token: tokens.id_token ?? null,
  };

  if (typeof onRefreshSuccess === 'function') {
    onRefreshSuccess(nextTokens);
  }

  return nextTokens.access_token;
}

export async function performLogout(accessToken) {
  if (!accessToken) return;
  try {
    await axios.post(
      `${API_BASE_URL}/auth/logout/`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch {
    // fire-and-forget: backend is idempotent and UI must not block on failures
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config || {};
    const status = error.response?.status;
    const isRefreshCall = (originalConfig.url || '').includes('/auth/refresh/');
    const hadAuthHeader = Boolean(originalConfig.headers?.Authorization);

    if (status !== 401 || originalConfig._retry || isRefreshCall || !hadAuthHeader) {
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (!refreshPromise) {
      refreshPromise = performRefresh().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      const newAccess = await refreshPromise;
      originalConfig.headers = {
        ...(originalConfig.headers || {}),
        Authorization: `Bearer ${newAccess}`,
      };
      return httpClient(originalConfig);
    } catch (refreshErr) {
      if (typeof onSessionExpired === 'function') onSessionExpired();
      return Promise.reject(refreshErr);
    }
  },
);

export default httpClient;
