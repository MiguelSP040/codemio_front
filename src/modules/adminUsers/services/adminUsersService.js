import httpClient from '../../../config/httpClient';

export async function listUsers() {
  const { data } = await httpClient.get('/users/');
  return data;
}

export async function getUserById(userId) {
  const { data } = await httpClient.get(`/users/${userId}/`);
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await httpClient.patch(`/users/${userId}/`, payload);
  return data;
}

export async function deleteUser(userId) {
  await httpClient.delete(`/users/${userId}/`);
}
