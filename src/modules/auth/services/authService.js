import apiClient from '../../../services/apiClient';
import API_BASE_URL from '../../../config/api';
import { socialDebugEnabled, socialSessionLogSummary } from '../utils/socialAuthDebug';

function trimTrailingSlashes(value = '') {
  let output = value;
  while (output.endsWith('/')) {
    output = output.slice(0, -1);
  }
  return output;
}

function backendOriginFromApiUrl() {
  const apiUrl = trimTrailingSlashes(API_BASE_URL || 'http://127.0.0.1:8000');
  try {
    return new URL(apiUrl).origin;
  } catch {
    return trimTrailingSlashes(apiUrl) || 'http://127.0.0.1:8000';
  }
}

/**
 * Inicia sesión del usuario con correo electrónico y contraseña.
 * La sesión se persiste en localStorage vía AuthContext.loginAuth.
 */
export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await apiClient.post('/auth/login/', {
    email: normalizedEmail,
    password,
  });
  return data;
}

/**
 * Start GitHub OAuth sign-up flow.
 * Pendiente: Replace with real OAuth redirect once the backend
 *       exposes a GitHub OAuth endpoint (e.g. GET /auth/github/).
 */
export async function githubAuth() {
  const apiBase = backendOriginFromApiUrl();
  if (socialDebugEnabled()) {
    console.log(`[social-oauth] redirecting to ${apiBase}/auth/github/`);
  }
  globalThis.window.location.assign(`${apiBase}/auth/github/`);
}

export async function getSocialSession() {
  if (socialDebugEnabled()) {
    console.log('[social-oauth] probing social session via /auth/social/session/');
  }
  const { data } = await apiClient.get('/auth/social/session/');
  if (socialDebugEnabled()) {
    console.log('[social-oauth] social session response summary', socialSessionLogSummary(data));
  }
  return data;
}

export async function exchangeSocialBootstrapCode(code) {
  const normalizedCode = String(code || '').trim();
  if (!normalizedCode) {
    throw new Error('Missing social bootstrap code');
  }
  if (socialDebugEnabled()) {
    console.log('[social-oauth] exchanging one-time bootstrap code');
  }
  const { data } = await apiClient.get('/auth/social/bootstrap/', {
    params: { code: normalizedCode },
  });
  return data;
}

export async function logoutSocialSession() {
  if (socialDebugEnabled()) {
    console.log('[social-oauth] posting /auth/social/logout/');
  }
  const { data } = await apiClient.post('/auth/social/logout/');
  if (socialDebugEnabled()) {
    console.log('[social-oauth] social logout response received');
  }
  return data;
}

/**
 * Fase B — Registra la cuenta (set password) después de verificar el correo.
 */
export async function registerAccount({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  await apiClient.post('/auth/register/', {
    email: normalizedEmail,
    password,
  });
  return login({ email: normalizedEmail, password });
}

/**
 * Recuperación de contraseña — paso 1: solicitar código de restablecimiento.
 */
export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await apiClient.post('/auth/forgot-password/', {
    email: normalizedEmail,
  });
  return data;
}

/**
 * Recuperación de contraseña — paso 2: confirmar nueva contraseña.
 */
export async function resetPassword({ email, code, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await apiClient.post('/auth/confirm-forgot-password/', {
    email: normalizedEmail,
    code: (code || '').trim(),
    new_password: password,
  });
  return data;
}
