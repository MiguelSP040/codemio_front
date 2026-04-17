import apiClient from '../../../services/apiClient';

export async function createProject({ name }) {
  const { data } = await apiClient.post('/projects/', { name });
  return data;
}

export async function getProjects({ page = 1 } = {}) {
  const { data } = await apiClient.get('/projects/', { params: { page } });
  return data;
}

export async function getProjectById(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/`);
  return data;
}

export async function updateProject(projectId, payload) {
  const { data } = await apiClient.patch(`/projects/${projectId}/`, payload);
  return data;
}

export async function deleteProject(projectId) {
  await apiClient.delete(`/projects/${projectId}/`);
}
