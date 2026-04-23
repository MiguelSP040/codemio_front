export function socialDebugEnabled() {
  return String(import.meta.env.VITE_SOCIAL_AUTH_DEBUG_LOGS || 'false').toLowerCase() === 'true';
}

export function socialSessionLogSummary(data) {
  const alphabetical = (a, b) => String(a).localeCompare(String(b));
  return {
    hasUsuario: Boolean(data?.usuario),
    hasClaims: Boolean(data?.claims),
    usuarioKeys: data?.usuario ? Object.keys(data.usuario).sort(alphabetical) : [],
    claimKeys: data?.claims ? Object.keys(data.claims).sort(alphabetical) : [],
  };
}
