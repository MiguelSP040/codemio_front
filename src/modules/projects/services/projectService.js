import httpClient from '../../../config/httpClient';

export async function createProject({ name }) {
  const { data } = await httpClient.post('/projects/', { name });
  return data;
}

export async function getProjects({ page = 1 } = {}) {
  const { data } = await httpClient.get('/projects/', { params: { page } });
  return data;
}

export async function getProjectById(projectId) {
  const { data } = await httpClient.get(`/projects/${projectId}/`);
  return data;
}

export async function updateProject(projectId, payload) {
  const { data } = await httpClient.patch(`/projects/${projectId}/`, payload);
  return data;
}

export async function deleteProject(projectId) {
  await httpClient.delete(`/projects/${projectId}/`);
}
