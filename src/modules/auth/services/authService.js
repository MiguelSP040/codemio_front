// import axios from 'axios';
// import API_BASE_URL from '../../../config/api';

/**
 * Inicia sesión del usuario con correo electrónico y contraseña.
 * Currently uses a mock delay — swap the body of this function
 * with the real API call once the backend endpoint is ready.
 */
export async function login({ email, password }) {
  // --- Mock implementation (remove when backend is ready) ---
  void password;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'error@test.com') {
    const err = new Error('Invalid credentials');
    err.response = { status: 401, data: { detail: 'Credenciales inválidas.' } };
    throw err;
  }

  return {
    token: 'mock-jwt-token',
    user: { id: 1, email, name: 'Usuario de Codemio' },
  };

  // --- Real implementation (uncomment when backend is ready) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/login/', { email, password });
  // return data;
}

/**
 * Register a new user.
 * Currently uses a mock delay — swap with real API call when ready.
 */
export async function register({ name, email, password }) {
  // --- Mock implementation (remove when backend is ready) ---
  void password;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'taken@test.com') {
    const err = new Error('Email already in use');
    err.response = { status: 409, data: { detail: 'Ya existe un usuario con este correo electrónico.' } };
    throw err;
  }

  return {
    token: 'mock-jwt-token',
    user: { id: 2, email, name },
  };

  // --- Real implementation (uncomment when backend is ready) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/register/', { name, email, password });
  // return data;
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
  // --- Mock ---
  void password;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'taken@test.com') {
    const err = new Error('Already registered');
    err.response = {
      status: 409,
      data: { code: 'UsernameExistsException', detail: 'Ya existe una cuenta con este correo.' },
    };
    throw err;
  }

  return {
    detail: 'Cuenta registrada. Usa POST /auth/login/ para obtener tokens.',
    already_registered: false,
    correo: email,
    sub_cognito: 'mock-sub-cognito',
  };

  // --- Real (descomentar al integrar) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/register/', { email, password });
  // return data;
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
  // --- Mock ---
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'notfound@test.com') {
    const err = new Error('User not found');
    err.response = {
      status: 404,
      data: { code: 'UserNotFoundException', detail: 'No existe una cuenta con este correo.' },
    };
    throw err;
  }

  return {
    detail: 'Se ha enviado un código de recuperación a tu correo.',
    email,
  };

  // --- Real (descomentar cuando backend implemente el endpoint) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/forgot-password/', { email });
  // return data;
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
export async function resetPassword({ email, password }) {
  // --- Mock ---
  void email;
  void password;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    detail: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.',
  };

  // --- Real (descomentar cuando backend implemente el endpoint) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/reset-password/', { email, code, password });
  // return data;
}
