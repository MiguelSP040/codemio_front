export function isAnalysisInstrumentationEnabled() {
  try {
    return import.meta.env?.VITE_DEBUG_ANALYSIS_INSTRUMENTATION === '1';
  } catch {
    return false;
  }
}

export function analysisPollLog(event, fields = {}) {
  if (!isAnalysisInstrumentationEnabled()) return;
  console.log('[analysis-poll]', event, fields);
}

export function analysisServiceLog(event, fields = {}) {
  if (!isAnalysisInstrumentationEnabled()) return;
  console.log('[analysis-service]', event, fields);
}

export function analysisDashboardLog(event, fields = {}) {
  if (!isAnalysisInstrumentationEnabled()) return;
  console.log('[dashboard]', event, fields);
}

export function analysisProjectsLog(event, fields = {}) {
  if (!isAnalysisInstrumentationEnabled()) return;
  console.log('[projects]', event, fields);
}
