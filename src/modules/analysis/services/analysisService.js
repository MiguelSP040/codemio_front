import axios from 'axios';
import API_BASE_URL from '../../../config/api';

const AUTH_STORAGE_KEY = 'codemio_auth';

function getAccessToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.accessToken || null;
  } catch {
    return null;
  }
}

function getAuthApi() {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Sesion expirada. Inicia sesion nuevamente.');
  }
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createAnalysisRun({ projectId, sourceFile }) {
  const api = getAuthApi();
  const formData = new FormData();
  formData.append('project_id', String(projectId));
  formData.append('source_file', sourceFile);
  const { data } = await api.post('/analysis/runs/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function listAnalysisRuns({ projectId, page = 1 } = {}) {
  const api = getAuthApi();
  const params = { page };
  if (projectId) params.project_id = projectId;
  const { data } = await api.get('/analysis/runs/', { params });
  return data;
}

export async function getAnalysisRun(runId) {
  const api = getAuthApi();
  const { data } = await api.get(`/analysis/runs/${runId}/`);
  return data;
}
