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

export async function createProject({ name }) {
  const token = getAccessToken();
  const authApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const { data } = await authApi.post('/projects/', { name });
  return data;
}