/* Friendly Spanish translations for technical error messages that bubble up
   from the backend or third-party services. Keeps the UI from surfacing raw
   DRF / SonarCloud strings like "Request was throttled. Expected available
   in 39 seconds." */

const MAX_INPUT_LENGTH = 2000;
const THROTTLED_PATTERN = /request was throttled[^\d]{0,200}?(\d+)\s{0,10}seconds?/i;
const SONAR_HTTP_PATTERN = /sonarcloud api respondió\s{0,10}(\d{3})[:\s]{0,10}(.{0,500})/i;
const AUTH_STATUS_CODES = new Set(['401', '403']);

const SPANISH_FALLBACKS = [
  {
    pattern: /No se pudo conectar con SonarCloud/i,
    message: 'No fue posible contactar al servicio de análisis. Revisa tu conexión y vuelve a intentarlo.',
  },
  {
    pattern: /sonar[-\s]?scanner excedió el tiempo/i,
    message: 'El análisis tardó demasiado y fue cancelado. Intenta con un archivo más pequeño.',
  },
];

function translateThrottle(match) {
  const seconds = Number(match[1]);
  if (Number.isFinite(seconds) && seconds > 0) {
    return `Demasiadas solicitudes al servicio de análisis. Intenta de nuevo en ${seconds} segundos.`;
  }
  return 'Demasiadas solicitudes al servicio de análisis. Intenta de nuevo en unos segundos.';
}

function translateSonarHttp(match) {
  const code = match[1];
  if (code === '429') {
    return 'SonarCloud rechazó la petición por saturación. Intenta nuevamente en unos minutos.';
  }
  if (AUTH_STATUS_CODES.has(code)) {
    return 'SonarCloud rechazó la autenticación. Contacta al administrador.';
  }
  const inner = humanizeErrorMessage(match[2]);
  if (inner) return inner;
  return `SonarCloud devolvió un error (${code}). Intenta nuevamente más tarde.`;
}

export function humanizeErrorMessage(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (text.length > MAX_INPUT_LENGTH) return text;

  const throttled = THROTTLED_PATTERN.exec(text);
  if (throttled) return translateThrottle(throttled);

  const sonarHttp = SONAR_HTTP_PATTERN.exec(text);
  if (sonarHttp) return translateSonarHttp(sonarHttp);

  for (const { pattern, message } of SPANISH_FALLBACKS) {
    if (pattern.test(text)) return message;
  }

  return text;
}

export default humanizeErrorMessage;
