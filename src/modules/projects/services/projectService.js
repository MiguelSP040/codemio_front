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
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function createProject({ name }) {
  const authApi = getAuthApi();
  const { data } = await authApi.post('/projects/', { name });
  return data;
}

export async function getProjects({ page = 1 } = {}) {
  const authApi = getAuthApi();
  const { data } = await authApi.get('/projects/', { params: { page } });
  return data;
}

export async function getProjectById(projectId) {
  const authApi = getAuthApi();
  const { data } = await authApi.get(`/projects/${projectId}/`);
  return data;
}

export async function updateProject(projectId, payload) {
  const authApi = getAuthApi();
  const { data } = await authApi.patch(`/projects/${projectId}/`, payload);
  return data;
}

export async function deleteProject(projectId) {
  const authApi = getAuthApi();
  await authApi.delete(`/projects/${projectId}/`);
}
