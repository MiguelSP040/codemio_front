// import axios from 'axios';
// import API_BASE_URL from '../../../config/api';

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

const MOCK_DELAY_MS = 900;

/**
 * Fase A.1 — Envía (o reenvía) el código OTP al correo del usuario.
 * Swagger: POST /auth/send/  { email }  → 201 { detail, email, cognito_sub, otp_flow }
 */
export async function sendVerificationCode({ email }) {
  // --- Mock ---
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  if (!email) {
    const err = new Error('Missing email');
    err.response = { status: 400, data: { detail: 'El correo es obligatorio.' } };
    throw err;
  }

  return {
    detail: 'Código de verificación enviado.',
    email,
    cognito_sub: 'mock-sub-cognito',
    otp_flow: 'initial',
  };

  // --- Real (descomentar al integrar) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/send/', { email });
  // return data;
}

/**
 * Reenvío del código OTP. A nivel backend es el mismo endpoint que `sendVerificationCode`
 * (Cognito devuelve otp_flow: 'resent' si la cuenta sigue UNCONFIRMED). Se expone como
 * función separada para claridad en la UI.
 * Swagger: POST /auth/send/  { email }
 */
export async function resendVerificationCode({ email }) {
  // --- Mock ---
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  return {
    detail: 'Código reenviado. Revisa tu bandeja de entrada.',
    email,
    cognito_sub: 'mock-sub-cognito',
    otp_flow: 'resent',
  };

  // --- Real ---
  // return sendVerificationCode({ email });
}

/**
 * Fase A.2 — Valida el código OTP.
 * Swagger: POST /auth/validate/  { email, otp }  → 200 { detail, email, already_verified }
 *          Errores: 400 OTP inválido · 404 no existe cuenta · 429 rate limit.
 */
export async function validateOtp({ email, otp }) {
  // --- Mock ---
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  // Códigos mock para probar UX:
  //   "000000" → inválido
  //   "111111" → expirado
  //   cualquier otro de 6 dígitos → éxito
  if (otp === '000000') {
    const err = new Error('Invalid OTP');
    err.response = {
      status: 400,
      data: { code: 'CodeMismatchException', detail: 'El código ingresado no es válido.' },
    };
    throw err;
  }

  if (otp === '111111') {
    const err = new Error('Expired OTP');
    err.response = {
      status: 400,
      data: { code: 'ExpiredCodeException', detail: 'El código expiró. Solicita uno nuevo.' },
    };
    throw err;
  }

  return {
    detail: 'Correo verificado correctamente.',
    email,
    already_verified: false,
  };

  // --- Real ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/validate/', { email, otp });
  // return data;
}

/**
 * Fase D — Actualiza el perfil del usuario autenticado (onboarding).
 * Swagger: PATCH /users/me/  { nombre?, edad?, perfil_github? }  → 200 Usuario
 *          Requiere Authorization: Bearer <access_token>.
 *          El backend calcula onboarding_completed = (nombre !== null && edad !== null).
 */
export async function completeProfile({ nombre, edad, perfil_github }) {
  // --- Mock ---
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return {
    correo: 'mock@codemio.com',
    rol: 'estudiante',
    nombre: nombre ?? null,
    edad: edad ?? null,
    perfil_github: perfil_github ?? null,
    fecha_registro: new Date().toISOString(),
    sub_cognito: 'mock-sub-cognito',
    onboarding_completed: Boolean(nombre) && edad !== null && edad !== undefined,
  };

  // --- Real (usar httpClient autenticado) ---
  // const { data } = await httpClient.patch('/users/me/', {
  //   nombre,
  //   edad,
  //   perfil_github: perfil_github || null,
  // });
  // return data;
}
