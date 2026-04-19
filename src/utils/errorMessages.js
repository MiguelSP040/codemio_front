/* Friendly Spanish translations for technical error messages that bubble up
   from the backend or third-party services. Keeps the UI from surfacing raw
   DRF / SonarCloud strings like "Request was throttled. Expected available
   in 39 seconds." */

const MAX_INPUT_LENGTH = 2000;
const THROTTLED_PATTERN = /request was throttled[^\d]{0,200}?(\d+)\s{0,10}seconds?/i;
const SONAR_HTTP_PATTERN = /sonarcloud api respondió\s{0,10}(\d{3})[:\s]{0,10}(.{0,500})/i;

export function humanizeErrorMessage(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (text.length > MAX_INPUT_LENGTH) return text;

  const throttled = THROTTLED_PATTERN.exec(text);
  if (throttled) {
    const seconds = Number(throttled[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return `Demasiadas solicitudes al servicio de análisis. Intenta de nuevo en ${seconds} segundos.`;
    }
    return 'Demasiadas solicitudes al servicio de análisis. Intenta de nuevo en unos segundos.';
  }

  const sonarHttp = SONAR_HTTP_PATTERN.exec(text);
  if (sonarHttp) {
    const code = sonarHttp[1];
    if (code === '429') {
      return 'SonarCloud rechazó la petición por saturación. Intenta nuevamente en unos minutos.';
    }
    if (code === '401' || code === '403') {
      return 'SonarCloud rechazó la autenticación. Contacta al administrador.';
    }
    const inner = humanizeErrorMessage(sonarHttp[2]);
    if (inner) return inner;
    return `SonarCloud devolvió un error (${code}). Intenta nuevamente más tarde.`;
  }

  if (/No se pudo conectar con SonarCloud/i.test(text)) {
    return 'No fue posible contactar al servicio de análisis. Revisa tu conexión y vuelve a intentarlo.';
  }
  if (/sonar[-\s]?scanner excedió el tiempo/i.test(text)) {
    return 'El análisis tardó demasiado y fue cancelado. Intenta con un archivo más pequeño.';
  }
  if (/Cola de análisis saturada/i.test(text)) {
    return text;
  }

  return text;
}

export default humanizeErrorMessage;
