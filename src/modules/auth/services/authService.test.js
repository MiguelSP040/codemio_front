import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  login,
  githubAuth,
  registerAccount,
  forgotPassword,
  resetPassword,
} from './authService';
import apiClient from '../../../services/apiClient';

vi.mock('../../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('posts normalized email to /auth/login/', async () => {
      apiClient.post.mockResolvedValue({ data: { token: 'x' } });
      const result = await login({ email: '  USER@Example.COM ', password: 'p' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/login/', {
        email: 'user@example.com',
        password: 'p',
      });
      expect(result).toEqual({ token: 'x' });
    });
  });

  describe('githubAuth', () => {
    it('redirige al endpoint backend de OAuth', async () => {
      const assign = vi.fn();
      Object.defineProperty(globalThis, 'window', {
        value: { location: { assign } },
        configurable: true,
      });
      vi.stubEnv('VITE_API_URL');
      vi.stubEnv('VITE_SOCIAL_AUTH_DEBUG_LOGS', 'false');
      await githubAuth();
      expect(assign).toHaveBeenCalledWith('http://localhost:8000/auth/github/');
    });
  });

  describe('registerAccount', () => {
    it('posts to /auth/register/ then calls login', async () => {
      apiClient.post.mockResolvedValue({ data: { token: 't' } });
      await registerAccount({ email: 'Foo@X.com', password: 'pw' });
      expect(apiClient.post).toHaveBeenNthCalledWith(1, '/auth/register/', {
        email: 'foo@x.com',
        password: 'pw',
      });
      expect(apiClient.post).toHaveBeenNthCalledWith(2, '/auth/login/', {
        email: 'foo@x.com',
        password: 'pw',
      });
    });
  });

  describe('forgotPassword', () => {
    it('posts normalized email to /auth/forgot-password/', async () => {
      apiClient.post.mockResolvedValue({ data: { sent: true } });
      const result = await forgotPassword({ email: 'A@X.com' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password/', {
        email: 'a@x.com',
      });
      expect(result).toEqual({ sent: true });
    });
  });

  describe('resetPassword', () => {
    it('posts normalized email and trimmed code to confirm endpoint', async () => {
      apiClient.post.mockResolvedValue({ data: { ok: true } });
      const result = await resetPassword({
        email: 'a@x.com',
        code: '  123456  ',
        password: 'newpw',
      });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/confirm-forgot-password/', {
        email: 'a@x.com',
        code: '123456',
        new_password: 'newpw',
      });
      expect(result).toEqual({ ok: true });
    });

    it('tolerates missing code', async () => {
      apiClient.post.mockResolvedValue({ data: {} });
      await resetPassword({ email: 'a@x.com', password: 'pw' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/confirm-forgot-password/', {
        email: 'a@x.com',
        code: '',
        new_password: 'pw',
      });
    });
  });
});
