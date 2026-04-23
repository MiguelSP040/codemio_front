import axios from 'axios';
import API_BASE_URL from '../config/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionEmail,
  updateTokens,
} from '../modules/auth/services/sessionService';

const SOCIAL_DEBUG = String(import.meta.env.VITE_SOCIAL_AUTH_DEBUG_LOGS || 'false').toLowerCase() === 'true';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    if (SOCIAL_DEBUG) {
      console.error('[social-oauth] refresh skipped: no refresh token available');
    }
    throw new Error('No refresh token available');
  }
  const email = getSessionEmail();
  refreshPromise = refreshClient
    .post('/auth/refresh/', {
      refresh_token: refreshToken,
      ...(email ? { email } : {}),
    })
    .then((response) => {
      const tokens = response?.data?.tokens || {};
      if (SOCIAL_DEBUG) {
        console.log('[social-oauth] refresh response', response?.data);
      }
      updateTokens({
        accessToken: tokens?.access_token || null,
        refreshToken: tokens?.refresh_token,
      });
      return tokens?.access_token || null;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const next = { ...config };
  const token = getAccessToken();
  if (token && !next?.headers?.Authorization) {
    next.headers = { ...next.headers, Authorization: `Bearer ${token}` };
  }
  return next;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;
    const isAuthEndpoint = String(originalRequest?.url || '').includes('/auth/');
    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
      if (SOCIAL_DEBUG && status === 401) {
        console.warn('[social-oauth] 401 ignored for auth endpoint or invalid retry context', {
          url: originalRequest?.url,
          isAuthEndpoint,
        });
      }
      throw error;
    }
    if (SOCIAL_DEBUG) {
      console.warn('[social-oauth] 401 intercepted, trying refresh', { url: originalRequest?.url });
    }
    originalRequest._retry = true;
    try {
      const newToken = await refreshAccessToken();
      if (!newToken) throw new Error('Unable to refresh access token');
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${newToken}`,
      };
      return apiClient(originalRequest);
    } catch (refreshError) {
      if (SOCIAL_DEBUG) {
        console.error('[social-oauth] refresh failed, clearing session', refreshError);
      }
      clearSession();
      if (globalThis.window !== undefined) {
        globalThis.window.dispatchEvent(new Event('codemio:auth-expired'));
      }
      throw refreshError;
    }
  },
);

export default apiClient;
