import httpClient from '../../../config/httpClient';

/**
 * Inicia sesión del usuario con correo electrónico y contraseña.
 * La persistencia en localStorage la maneja AuthContext.loginAuth(data).
 */
export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await httpClient.post('/auth/login/', {
    email: normalizedEmail,
    password,
  });
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
