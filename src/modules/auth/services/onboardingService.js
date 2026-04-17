import httpClient from '../../../config/httpClient';
import { encryptProfilePayload } from './payloadCrypto';

/**
 * Servicios del flujo de onboarding de Codemio.
 *
 *  - sendVerificationCode  → POST /auth/send/       body: { email }
 *  - validateOtp           → POST /auth/validate/   body: { email, otp }
 *  - completeProfile       → PATCH /users/me/       body: { nombre, edad, perfil_github }
 *                                                   header: Authorization: Bearer <access_token>
 */

/**
 * Fase A.1 — Envía (o reenvía) el código OTP al correo del usuario.
 * Swagger: POST /auth/send/  { email }  → 201 { detail, email, cognito_sub, otp_flow }
 */
export async function sendVerificationCode({ email }) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data } = await httpClient.post('/auth/send/', { email: normalizedEmail });
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
    const { data } = await httpClient.post('/auth/forgot-password/validate-code/', {
      email: normalizedEmail,
      code: otp,
    });
    return data;
  }

  const { data } = await httpClient.post('/auth/validate/', {
    email: normalizedEmail,
    otp,
  });
  return data;
}

/**
 * Fase D — Actualiza el perfil del usuario autenticado (onboarding).
 * Swagger: PATCH /users/me/  { nombre?, edad?, perfil_github? }  → 200 Usuario
 *          Requiere Authorization: Bearer <access_token> (httpClient interceptor lo añade).
 *          El backend calcula onboarding_completed = (nombre !== null && edad !== null).
 */
export async function completeProfile({ nombre, edad, perfil_github }) {
  const { data: publicKeyPayload } = await httpClient.get('/auth/payload-public-key/');

  const encryptedPayload = await encryptProfilePayload(
    {
      nombre,
      edad,
      perfil_github: perfil_github || null,
    },
    publicKeyPayload,
  );

  const { data } = await httpClient.patch('/users/me/', encryptedPayload);

  return data;
}
