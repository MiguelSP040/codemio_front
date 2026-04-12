// import axios from 'axios';
// import API_BASE_URL from '../../../config/api';

/**
 * Login user with email and password.
 * Currently uses a mock delay — swap the body of this function
 * with the real API call once the backend endpoint is ready.
 */
export async function login({ email, password }) {
  // --- Mock implementation (remove when backend is ready) ---
  void password;
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

/**
 * Register a new user.
 * Currently uses a mock delay — swap with real API call when ready.
 */
export async function register({ name, email, password }) {
  // --- Mock implementation (remove when backend is ready) ---
  void password;
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (email === 'taken@test.com') {
    const err = new Error('Email already in use');
    err.response = { status: 409, data: { detail: 'A user with this email already exists.' } };
    throw err;
  }

  return {
    token: 'mock-jwt-token',
    user: { id: 2, email, name },
  };

  // --- Real implementation (uncomment when backend is ready) ---
  // const authApi = axios.create({
  //   baseURL: API_BASE_URL,
  //   headers: { 'Content-Type': 'application/json' },
  // });
  // const { data } = await authApi.post('/auth/register/', { name, email, password });
  // return data;
}

/**
 * Start GitHub OAuth sign-up flow.
 * TODO: Replace with real OAuth redirect once the backend
 *       exposes a GitHub OAuth endpoint (e.g. GET /auth/github/).
 *       The flow should redirect the user to GitHub's authorize URL
 *       and handle the callback with the returned code/token.
 */
export async function githubAuth() {
  console.log('[authService] GitHub OAuth not implemented yet');
}
