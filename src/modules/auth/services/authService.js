import axios from 'axios';
import API_BASE_URL from '../../../config/api';
import { saveSessionFromAuthPayload } from './sessionService';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function saveSession(payload) {
  saveSessionFromAuthPayload(payload);
}

/**
 * Inicia sesión del usuario con correo electrónico y contraseña.
 * Currently uses a mock delay — swap the body of this function
 * with the real API call once the backend endpoint is ready.
 */
export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await authApi.post('/auth/login/', {
    email: normalizedEmail,
    password,
  });
  saveSession(data);
  return data;
}

/**
 * Register a new user.
 * Currently uses a mock delay — swap with real API call when ready.
 */
export async function register({ name, email, password }) {
  void name;
  const normalizedEmail = email.trim().toLowerCase();
  await authApi.post('/auth/register/', {
    email: normalizedEmail,
    password,
  });

  return login({ email: normalizedEmail, password });
}

/**
 * Start GitHub OAuth sign-up flow.
 * TODO: Replace with real OAuth redirect once the backend
 *       exposes a GitHub OAuth endpoint (e.g. GET /auth/github/).
 *       The flow should redirect the user to GitHub's authorize URL
 *       and handle the callback with the returned code/token.
 */
export async function githubAuth() {
  console.log('[authService] GitHub OAuth not implemented yet');
}

/**
 * Fase B — Registra la cuenta (set password) después de verificar el correo.
 * TODO: Reemplazar mock con llamada real:
 *   POST /auth/register/  body: { email, password }
 *   → 201 { detail, already_registered, correo, sub_cognito }
 *   Errores: 400 password inválido · 403 correo no verificado · 404 sin cuenta Cognito · 409 conflicto sub
 */
export async function registerAccount({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  await authApi.post('/auth/register/', {
    email: normalizedEmail,
    password,
  });

  return login({ email: normalizedEmail, password });
}

/**
 * Recuperación de contraseña — paso 1: solicitar código de restablecimiento.
 * TODO: El backend NO tiene este endpoint todavía.
 *   Cuando se implemente en Cognito, será algo como:
 *   POST /auth/forgot-password/  body: { email }
 *   → 200 { detail, email }
 *   Cognito usa ForgotPassword API (envía código al correo).
 */
export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await authApi.post('/auth/forgot-password/', {
    email: normalizedEmail,
  });
  return data;
}

/**
 * Recuperación de contraseña — paso 2: confirmar nueva contraseña.
 * TODO: El backend NO tiene este endpoint todavía.
 *   Cuando se implemente en Cognito, será algo como:
 *   POST /auth/reset-password/  body: { email, code, password }
 *   → 200 { detail }
 *   Cognito usa ConfirmForgotPassword API.
 *   NOTA: Probablemente se necesitará un paso intermedio de código OTP
 *   entre forgot-password y reset-password. Por ahora el mock va directo.
 */
export async function resetPassword({ email, code, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await authApi.post('/auth/confirm-forgot-password/', {
    email: normalizedEmail,
    code: (code || '').trim(),
    new_password: password,
  });
  return data;
}
