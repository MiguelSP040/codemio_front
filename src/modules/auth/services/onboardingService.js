import axios from 'axios';
import API_BASE_URL from '../../../config/api';

/**
 * Servicios del flujo de onboarding de Codemio.
 *
 * Actualmente todas las funciones son MOCKS con la misma forma de entrada/salida
 * que los endpoints reales del backend (drf_yasg). Cuando la rama de integración
 * tome estos mocks, solo hay que reemplazar el cuerpo por la llamada axios real:
 *
 *  - sendVerificationCode  → POST /auth/send/       body: { email }
 *  - validateOtp           → POST /auth/validate/   body: { email, otp }
 *  - completeProfile       → PATCH /users/me/       body: { nombre, edad, perfil_github }
 *                                                   header: Authorization: Bearer <access_token>
 */

const AUTH_STORAGE_KEY = 'codemio_auth';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

function getAccessToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    return session?.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Fase A.1 — Envía (o reenvía) el código OTP al correo del usuario.
 * Swagger: POST /auth/send/  { email }  → 201 { detail, email, cognito_sub, otp_flow }
 */
export async function sendVerificationCode({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await authApi.post('/auth/send/', { email: normalizedEmail });
  return data;
}

/**
 * Reenvío del código OTP. A nivel backend es el mismo endpoint que `sendVerificationCode`
 * (Cognito devuelve otp_flow: 'resent' si la cuenta sigue UNCONFIRMED). Se expone como
 * función separada para claridad en la UI.
 * Swagger: POST /auth/send/  { email }
 */
export async function resendVerificationCode({ email }) {
  return sendVerificationCode({ email });
}

/**
 * Fase A.2 — Valida el código OTP.
 * Swagger: POST /auth/validate/  { email, otp }  → 200 { detail, email, already_verified }
 *          Errores: 400 OTP inválido · 404 no existe cuenta · 429 rate limit.
 */
export async function validateOtp({ email, otp, flow = 'register' }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (flow === 'recovery') {
    const { data } = await authApi.post('/auth/forgot-password/validate-code/', {
      email: normalizedEmail,
      code: otp,
    });
    return data;
  }

  const { data } = await authApi.post('/auth/validate/', {
    email: normalizedEmail,
    otp,
  });
  return data;
}

/**
 * Fase D — Actualiza el perfil del usuario autenticado (onboarding).
 * Swagger: PATCH /users/me/  { nombre?, edad?, perfil_github? }  → 200 Usuario
 *          Requiere Authorization: Bearer <access_token>.
 *          El backend calcula onboarding_completed = (nombre !== null && edad !== null).
 */
export async function completeProfile({ nombre, edad, perfil_github }) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    const err = new Error('Missing access token');
    err.response = {
      status: 401,
      data: { detail: 'No hay sesión activa. Inicia sesión para completar tu perfil.' },
    };
    throw err;
  }

  const { data } = await authApi.patch(
    '/users/me/',
    {
      nombre,
      edad,
      perfil_github: perfil_github || null,
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  return data;
}
