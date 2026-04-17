import axios from 'axios';
import API_BASE_URL from '../config/api';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getSessionEmail,
  updateTokens,
} from '../modules/auth/services/sessionService';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
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
      throw error;
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
      clearSession();
      if (globalThis.window !== undefined) {
        globalThis.window.dispatchEvent(new Event('codemio:auth-expired'));
      }
      throw refreshError;
    }
  },
);

export default apiClient;
