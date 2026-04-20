import apiClient from '../../../services/apiClient';
import { analysisServiceLog } from '../../../utils/analysisInstrumentation';
import { getAccessToken } from '../../auth/services/sessionService';

function perfNow() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function ensureSessionToken() {
  if (!getAccessToken()) {
    throw new Error('Sesion expirada. Inicia sesion nuevamente.');
  }
}

export function isRetriableAnalysisError(err) {
  const code = err?.code;
  const status = err?.response?.status;
  if (!err?.response && (code === 'ERR_NETWORK' || code === 'ECONNABORTED')) return true;
  if (typeof status === 'number' && status >= 500 && status < 600) return true;
  if (status === 429) return true;
  return false;
}

export async function createAnalysisRun({ projectId, sourceFile }) {
  ensureSessionToken();
  const formData = new FormData();
  formData.append('project_id', String(projectId));
  formData.append('source_file', sourceFile);
  const { data } = await apiClient.post('/analysis/runs/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function listAnalysisRuns({ projectId, page = 1, status, activeOnly } = {}) {
  ensureSessionToken();
  const params = { page };
  if (projectId) params.project_id = projectId;
  if (status) params.status = status;
  if (activeOnly) params.active_only = true;
  const { data } = await apiClient.get('/analysis/runs/', { params });
  return data;
}

export async function getAnalysisRun(runId) {
  ensureSessionToken();
  const { data } = await apiClient.get(`/analysis/runs/${runId}/`);
  return data;
}

export async function getAnalysisRunStatus(runId) {
  ensureSessionToken();
  const { data } = await apiClient.get(`/analysis/runs/${runId}/status/`);
  return data;
}

export async function fetchAnalysisRunsStatusBulk(runIds) {
  ensureSessionToken();
  const ids = [...new Set(runIds.filter((id) => id != null))].slice(0, 25);
  const map = new Map();
  if (ids.length === 0) return map;
  const t0 = perfNow();
  analysisServiceLog('status_bulk:start', { requestedIds: ids, idsCount: ids.length, projectId: null });
  try {
    const { data } = await apiClient.get('/analysis/runs/status_bulk/', {
      params: { ids: ids.join(',') },
    });
    const rows = Array.isArray(data) ? data : [];
    rows.forEach((row) => {
      if (row && row.id != null) {
        map.set(row.id, analysisStatusPayloadToRunShape(row.id, row));
      }
    });
    analysisServiceLog('status_bulk:success', {
      requestedIds: ids,
      idsCount: ids.length,
      resolvedCount: map.size,
      durationMs: Math.round(perfNow() - t0),
    });
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const message =
      (typeof data?.detail === 'string' && data.detail) ||
      (typeof data?.message === 'string' && data.message) ||
      String(err?.message || err).slice(0, 200);
    analysisServiceLog('status_bulk:error', {
      requestedIds: ids,
      idsCount: ids.length,
      durationMs: Math.round(perfNow() - t0),
      code: status ?? err?.code ?? '',
      message,
    });
    throw err;
  }
  return map;
}

function analysisStatusPayloadToRunShape(runId, payload) {
  if (!payload || typeof payload !== 'object') return null;
  return {
    id: payload.id ?? runId,
    status: payload.status,
    quality_gate_status: payload.quality_gate_status,
    error_summary: payload.error_summary,
    error_detail: payload.error_detail,
  };
}

async function fetchRunsStateMapViaListAndDetail(projectId, trackedRunIds) {
  const runsById = new Map();
  const uniqueIds = [...new Set(trackedRunIds.filter((id) => id != null))];
  const response = await listAnalysisRuns({ projectId, activeOnly: true });
  const runs = Array.isArray(response?.results) ? response.results : [];
  const fromList = new Map(runs.map((run) => [run.id, run]));
  uniqueIds.forEach((id) => {
    if (!runsById.has(id) && fromList.has(id)) {
      runsById.set(id, fromList.get(id));
    }
  });

  const missingIds = uniqueIds.filter((id) => !runsById.has(id));
  if (missingIds.length > 0) {
    await Promise.all(
      missingIds.map(async (id) => {
        try {
          const run = await getAnalysisRun(id);
          if (run) runsById.set(run.id ?? id, run);
        } catch {
          /* se reintenta en el siguiente tick */
        }
      }),
    );
  }

  return runsById;
}

export async function fetchRunsStateMapForTrackedIds(projectId, trackedRunIds) {
  const runsById = new Map();
  if (!Array.isArray(trackedRunIds) || trackedRunIds.length === 0) {
    return runsById;
  }

  const tTotal = perfNow();
  const uniqueIds = [...new Set(trackedRunIds.filter((id) => id != null))];

  const bulk = await fetchAnalysisRunsStatusBulk(uniqueIds);
  bulk.forEach((shape, id) => {
    if (shape) runsById.set(id, shape);
  });

  const missingAfterBulk = uniqueIds.filter((id) => !runsById.has(id));
  if (missingAfterBulk.length > 0) {
    const tInd = perfNow();
    analysisServiceLog('status_individual:fallback', {
      projectId,
      requestedIds: uniqueIds,
      missingIds: missingAfterBulk,
      reason: 'after_bulk',
    });
    const settled = await Promise.allSettled(
      missingAfterBulk.map(async (id) => {
        const data = await getAnalysisRunStatus(id);
        return { id, shape: analysisStatusPayloadToRunShape(id, data) };
      }),
    );
    for (const res of settled) {
      if (res.status === 'fulfilled' && res.value?.shape) {
        runsById.set(res.value.id, res.value.shape);
      }
    }
    analysisServiceLog('status_individual:fallback', {
      projectId,
      missingIds: missingAfterBulk,
      resolvedCount: missingAfterBulk.filter((id) => runsById.has(id)).length,
      durationMs: Math.round(perfNow() - tInd),
      reason: 'individual_status_done',
    });
  }

  const stillMissing = uniqueIds.filter((id) => !runsById.has(id));
  if (stillMissing.length > 0 && projectId != null) {
    const tList = perfNow();
    analysisServiceLog('list_runs:fallback', {
      projectId,
      missingIds: stillMissing,
      reason: 'list_plus_detail',
    });
    const fallback = await fetchRunsStateMapViaListAndDetail(projectId, stillMissing);
    fallback.forEach((v, k) => {
      if (!runsById.has(k)) runsById.set(k, v);
    });
    analysisServiceLog('list_runs:fallback', {
      projectId,
      missingIds: stillMissing,
      resolvedCount: stillMissing.filter((id) => runsById.has(id)).length,
      durationMs: Math.round(perfNow() - tList),
      reason: 'list_done',
    });
  }

  const finalMissing = uniqueIds.filter((id) => !runsById.has(id));
  if (finalMissing.length > 0) {
    const tDetail = perfNow();
    analysisServiceLog('status_individual:fallback', {
      projectId,
      missingIds: finalMissing,
      reason: 'get_full_run',
    });
    await Promise.all(
      finalMissing.map(async (id) => {
        try {
          const run = await getAnalysisRun(id);
          if (run) runsById.set(run.id ?? id, analysisStatusPayloadToRunShape(id, run));
        } catch {
          /* siguiente tick */
        }
      }),
    );
    analysisServiceLog('status_individual:fallback', {
      projectId,
      missingIds: finalMissing,
      resolvedCount: finalMissing.filter((id) => runsById.has(id)).length,
      durationMs: Math.round(perfNow() - tDetail),
      reason: 'get_full_run_done',
    });
  }

  analysisServiceLog('tracked_ids:resolved', {
    projectId,
    requestedIds: uniqueIds,
    resolvedCount: uniqueIds.filter((id) => runsById.has(id)).length,
    durationMs: Math.round(perfNow() - tTotal),
  });

  return runsById;
}
