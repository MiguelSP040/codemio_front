import apiClient from '../../../services/apiClient';

export async function listUsers() {
  const { data } = await apiClient.get('/users/');
  return data;
}

export async function getUserById(userId) {
  const { data } = await apiClient.get(`/users/${userId}/`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await apiClient.patch(`/users/${userId}/`, payload);
  return data;
}

export async function deleteUser(userId) {
  await apiClient.delete(`/users/${userId}/`);
}

