import httpClient, { STORAGE_AUTH } from '../../../config/httpClient';

function saveSession(payload) {
  const tokens = payload?.tokens;
  if (!tokens?.access_token) return;

  const next = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_in: tokens.expires_in ?? null,
    token_type: tokens.token_type ?? 'Bearer',
    id_token: tokens.id_token ?? null,
    usuario: payload?.usuario ?? null,
  };
  localStorage.setItem(STORAGE_AUTH, JSON.stringify(next));
}

/**
 * Inicia sesión del usuario con correo electrónico y contraseña.
 */
export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await httpClient.post('/auth/login/', {
    email: normalizedEmail,
    password,
  });
  saveSession(data);
  return data;
}

/**
 * Register a new user.
 */
export async function register({ name, email, password }) {
  void name;
  const normalizedEmail = email.trim().toLowerCase();
  await httpClient.post('/auth/register/', {
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
 */
export async function registerAccount({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  await httpClient.post('/auth/register/', {
    email: normalizedEmail,
    password,
  });

  return login({ email: normalizedEmail, password });
}

/**
 * Recuperación de contraseña — paso 1: solicitar código de restablecimiento.
 * TODO: El backend NO tiene este endpoint todavía.
 */
export async function forgotPassword({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await httpClient.post('/auth/forgot-password/', {
    email: normalizedEmail,
  });
  return data;
}

/**
 * Recuperación de contraseña — paso 2: confirmar nueva contraseña.
 * TODO: El backend NO tiene este endpoint todavía.
 */
export async function resetPassword({ email, code, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await httpClient.post('/auth/confirm-forgot-password/', {
    email: normalizedEmail,
    code: (code || '').trim(),
    new_password: password,
  });
  return data;
}
