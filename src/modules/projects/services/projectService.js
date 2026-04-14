// import axios from 'axios';
// import API_BASE_URL from '../../../config/api';

/**
 * Crear un nuevo proyecto.
 * TODO: Reemplazar con la llamada real al endpoint POST /api/projects/
 *       cuando el backend esté listo.
 */
export async function createProject({ name }) {
  // --- Mock (eliminar cuando el backend esté listo) ---
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (name.toLowerCase() === 'error') {
    const err = new Error('Error de validación');
    err.response = { status: 400, data: { detail: 'Ya existe un proyecto con ese nombre.' } };
    throw err;
  }

  return {
    id: Date.now(),
    name,
    owner: { id: 1, email: 'codemio@gmail.com' },
    created_at: new Date().toISOString(),
  };

  // --- Implementación real (descomentar cuando el backend esté listo) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${token}`,
  //   },
  // });
  // const { data } = await authApi.post('/projects/', { name });
  // return data;
}
