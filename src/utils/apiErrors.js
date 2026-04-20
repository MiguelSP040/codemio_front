export function extractApiErrorMessage(err, fallback = 'Algo salió mal. Inténtalo de nuevo.') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return data.detail || data.message || fallback;
}
