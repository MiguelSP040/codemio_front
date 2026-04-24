const OTP_RE = /^\d{6}$/;

const PROFILE_NAME_MIN_LEN = 2;
const PROFILE_NAME_MAX_LEN = 100;
const PROFILE_AGE_MIN = 13;
const PROFILE_AGE_MAX = 120;
const PROJECT_NAME_MAX_LEN = 49;
const PROFILE_NAME_ALLOWED_CHARS_RE = /^[\p{L}\p{M} .'-]+$/u;

// Email con cuantificadores acotados a límites RFC 5321 para evitar ReDoS.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,63}$/;
// Bloquea tags HTML y caracteres de control comunes (cuantificadores acotados para evitar ReDoS).
const HAS_HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9]{0,20}(?:\s[^>]{0,500})?>/;
// eslint-disable-next-line no-control-regex
const HAS_CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/;
const PROJECT_NAME_ALLOWED_CHARS_RE = /^[\p{L}\p{N} _.-]+$/u;

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
  
  const withoutTags = raw.replaceAll(/<[^>]{0,1000}>/g, '');
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
  if (!PROFILE_NAME_ALLOWED_CHARS_RE.test(cleaned)) {
    return 'El nombre contiene caracteres no permitidos.';
  }
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
  if (Number.isNaN(Number(value)) || !Number.isInteger(Number(value))) return 'Ingresa un número entero.';
  const n = Number(value);
  if (n < PROFILE_AGE_MIN) return `La edad mínima permitida es ${PROFILE_AGE_MIN}.`;
  if (n > PROFILE_AGE_MAX) return `Ingresa una edad válida (máximo ${PROFILE_AGE_MAX}).`;
  return '';
}

export function validatePerfilGithub(value, { required = false } = {}) {
  const raw = (value ?? '').toString();
  const cleaned = sanitizePlainText(raw);

  if (!cleaned) return required ? 'Este campo es obligatorio.' : '';
  if (containsHtml(raw)) return 'El perfil de GitHub no puede contener etiquetas HTML.';
  if (!/^(?!-)(?!.*--)[A-Za-z0-9-]{1,39}(?<!-)$/.test(cleaned)) {
    return 'Ingresa un usuario de GitHub válido (sin URL).';
  }
  return '';
}

export function isValidProjectName(value) {
  const raw = (value ?? '').toString().trim();
  return raw.length > 0 && raw.length <= PROJECT_NAME_MAX_LEN && PROJECT_NAME_ALLOWED_CHARS_RE.test(raw);
}

export function validateProjectName(value, { required = true } = {}) {
  const raw = (value ?? '').toString();
  const cleaned = sanitizePlainText(raw);

  if (!cleaned) return required ? 'Este campo es obligatorio.' : '';
  if (containsHtml(raw)) return 'El nombre del proyecto no puede contener etiquetas HTML.';
  if (cleaned.length > PROJECT_NAME_MAX_LEN) {
    return 'El nombre del proyecto es demasiado largo.';
  }
  if (!PROJECT_NAME_ALLOWED_CHARS_RE.test(cleaned)) {
    return 'El nombre del proyecto contiene caracteres no permitidos.';
  }
  return '';
}
