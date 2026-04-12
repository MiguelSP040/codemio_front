// import axios from 'axios';
// import API_BASE_URL from '../../../config/api';

/**
 * Login user with email and password.
 * Currently uses a mock delay — swap the body of this function
 * with the real API call once the backend endpoint is ready.
 */
export async function login({ email, password }) {
  // --- Mock implementation (remove when backend is ready) ---
  void password; // used by real API call below
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'error@test.com') {
    const err = new Error('Invalid credentials');
    err.response = { status: 401, data: { detail: 'Invalid credentials.' } };
    throw err;
  }

  return {
    token: 'mock-jwt-token',
    user: { id: 1, email, name: 'Codemio User' },
  };

  // --- Real implementation (uncomment when backend is ready) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/login/', { email, password });
  // return data;
}
