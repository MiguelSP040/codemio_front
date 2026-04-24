const MAX_ERROR_LENGTH = 280;

function normalizeMessage(input) {
  const text = String(input ?? '').trim();
  if (!text) return '';

  // Do not expose full HTML/debug pages from backend errors.
  if (/<!doctype html|<html[\s>]/i.test(text)) return '';

  // Strip simple HTML tags if they come in as part of an error payload.
  // Use atomic pattern to prevent ReDoS: match < followed by non-< and non-> chars, then >.
  const stripped = text.replace(/<(?:[^<>])*>/g, ' ').replaceAll(/\s+/g, ' ').trim();
  if (!stripped) return '';

  if (stripped.length > MAX_ERROR_LENGTH) {
    return `${stripped.slice(0, MAX_ERROR_LENGTH)}...`;
  }
  return stripped;
}

export function extractApiErrorMessage(err, fallback = 'Algo salió mal. Inténtalo de nuevo.') {
  const data = err?.response?.data;
  if (!data) return fallback;

  if (typeof data === 'string') {
    return normalizeMessage(data) || fallback;
  }

  const detail = normalizeMessage(data?.detail);
  if (detail) return detail;

  const message = normalizeMessage(data?.message);
  if (message) return message;

  return fallback;
}
