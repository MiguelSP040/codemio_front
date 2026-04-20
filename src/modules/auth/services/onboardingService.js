import apiClient from '../../../services/apiClient';
import { getAccessToken } from './sessionService';
import { encryptProfilePayload } from './payloadCrypto';

/**
 * Servicios del flujo de onboarding de Codemio.
 *
 *  - sendVerificationCode  → POST /auth/send/       body: { email }
 *  - validateOtp           → POST /auth/validate/   body: { email, otp }
 *  - completeProfile       → PATCH /users/me/       body: { nombre, edad, perfil_github }
 *
 * Authorization se añade automáticamente por el interceptor de apiClient cuando existe sesión.
 */

/**
 * Fase A.1 — Envía (o reenvía) el código OTP al correo del usuario.
 */
export async function sendVerificationCode({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await apiClient.post('/auth/send/', { email: normalizedEmail });
  return data;
}

/**
 * Reenvío del código OTP (mismo endpoint que sendVerificationCode).
 */
export async function resendVerificationCode({ email }) {
  return sendVerificationCode({ email });
}

/**
 * Fase A.2 — Valida el código OTP.
 */
export async function validateOtp({ email, otp, flow = 'register' }) {
  const normalizedEmail = email.trim().toLowerCase();

  if (flow === 'recovery') {
    const { data } = await apiClient.post('/auth/forgot-password/validate-code/', {
      email: normalizedEmail,
      code: otp,
    });
    return data;
  }

  const { data } = await apiClient.post('/auth/validate/', {
    email: normalizedEmail,
    otp,
  });
  return data;
}

/**
 * Fase D — Actualiza el perfil del usuario autenticado (onboarding).
 * Requiere sesión activa; el interceptor de apiClient adjunta Authorization.
 */
export async function completeProfile({ nombre, edad, perfil_github }) {
  if (!getAccessToken()) {
    const err = new Error('Missing access token');
    err.response = {
      status: 401,
      data: { detail: 'No hay sesión activa. Inicia sesión para completar tu perfil.' },
    };
    throw err;
  }

  const { data: publicKeyPayload } = await apiClient.get('/auth/payload-public-key/');

  const encryptedPayload = await encryptProfilePayload(
    {
      nombre,
      edad,
      perfil_github: perfil_github || null,
    },
    publicKeyPayload,
  );

  const { data } = await apiClient.patch('/users/me/', encryptedPayload);
  return data;
}
