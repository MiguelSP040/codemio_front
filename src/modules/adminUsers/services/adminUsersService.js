import axios from 'axios';
import API_BASE_URL from '../../../config/api';

const AUTH_STORAGE_KEY = 'codemio_auth';
const LEGACY_AUTH_STORAGE_KEY = 'auth';

function getAccessToken() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.accessToken || parsed?.token || parsed?.tokens?.access_token || null;
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

export async function listUsers() {
  const api = getAuthApi();
  const { data } = await api.get('/users/');
  return data;
}

export async function getUserById(userId) {
  const api = getAuthApi();
  const { data } = await api.get(`/users/${userId}/`);
  return data;
}

export async function updateUser(userId, payload) {
  const api = getAuthApi();
  const { data } = await api.patch(`/users/${userId}/`, payload);
  return data;
}

export async function deleteUser(userId) {
  const api = getAuthApi();
  await api.delete(`/users/${userId}/`);
}

