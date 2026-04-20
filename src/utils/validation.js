const OTP_RE = /^\d{6}$/;

const PROFILE_NAME_MIN_LEN = 2;
const PROFILE_NAME_MAX_LEN = 100;
const PROFILE_AGE_MIN = 1;
const PROFILE_AGE_MAX = 120;

// Email con cuantificadores acotados a límites RFC 5321 para evitar ReDoS.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;
// Bloquea tags HTML y caracteres de control comunes (cuantificadores acotados para evitar ReDoS).
const HAS_HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9]{0,20}(?:\s[^>]{0,500})?>/;
// eslint-disable-next-line no-control-regex
const HAS_CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;

export function isValidOtp(value) {
  return OTP_RE.test((value ?? '').toString());
}

export function isValidEmail(value) {
  return EMAIL_RE.test((value ?? '').toString());
}

export function sanitizePlainText(value) {
  const raw = (value ?? '').toString();
  
  if (raw.length > 10000) {
    return raw.slice(0, 10000).trim();
  }
  
  const withoutTags = raw.replace(/<[^>]{0,1000}>/g, '');
  return withoutTags.replace(HAS_CONTROL_CHARS_RE, '').trim();
}

export function containsHtml(value) {
  return HAS_HTML_TAG_RE.test((value ?? '').toString());
}

export function validateNombre(value, { required = true } = {}) {
  const raw = (value ?? '').toString();
  const cleaned = sanitizePlainText(raw);

  if (!cleaned) return required ? 'Este campo es obligatorio.' : '';
  if (containsHtml(raw)) return 'El nombre no puede contener etiquetas HTML.';
  if (cleaned.length < PROFILE_NAME_MIN_LEN) {
    return `El nombre debe tener al menos ${PROFILE_NAME_MIN_LEN} caracteres.`;
  }
  if (cleaned.length > PROFILE_NAME_MAX_LEN) {
    return `El nombre no puede exceder ${PROFILE_NAME_MAX_LEN} caracteres.`;
  }
  return '';
}

export function validateEdad(value, { required = true } = {}) {
  if (value === null || value === undefined || value === '') {
    return required ? 'Este campo es obligatorio.' : '';
  }
  if (isNaN(value) || !Number.isInteger(Number(value))) return 'Ingresa un número entero.';
  const n = Number(value);
  if (n < PROFILE_AGE_MIN) return 'La edad debe ser mayor que 0.';
  if (n > PROFILE_AGE_MAX) return `Ingresa una edad válida (máximo ${PROFILE_AGE_MAX}).`;
  return '';
}

export function validatePerfilGithub(value, { required = false } = {}) {
  const raw = (value ?? '').toString();
  const cleaned = sanitizePlainText(raw);

  if (!cleaned) return required ? 'Este campo es obligatorio.' : '';
  if (containsHtml(raw)) return 'El perfil de GitHub no puede contener etiquetas HTML.';
  // Texto simple: evitamos caracteres raros/control; permitimos letras, números, . - _ / : (por URLs o usernames).
  if (!/^[A-Za-z0-9._\-/:]+$/.test(cleaned)) {
    return 'El perfil de GitHub contiene caracteres no permitidos.';
  }
  if (cleaned.length > 255) return 'El perfil de GitHub es demasiado largo.';
  return '';
}
