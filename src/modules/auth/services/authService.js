import apiClient from '../../../services/apiClient';

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
  console.log('[authService] GitHub OAuth not implemented yet');
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
