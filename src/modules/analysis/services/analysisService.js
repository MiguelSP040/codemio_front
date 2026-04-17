import apiClient from '../../../services/apiClient';
import { getAccessToken } from '../../auth/services/sessionService';

function ensureSessionToken() {
  if (!getAccessToken()) {
    throw new Error('Sesion expirada. Inicia sesion nuevamente.');
  }
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
