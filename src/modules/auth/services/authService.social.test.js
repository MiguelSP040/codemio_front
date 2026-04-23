import { describe, expect, it, vi } from 'vitest';
import { githubAuth } from './authService';

describe('authService social oauth', () => {
  it('githubAuth redirige al endpoint backend /auth/github/', () => {
    vi.stubEnv('VITE_SOCIAL_AUTH_DEBUG_LOGS', 'true');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const assign = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      value: { location: { assign } },
      configurable: true,
    });
    vi.stubEnv('VITE_API_URL');
    githubAuth();
    expect(assign).toHaveBeenCalledWith('http://localhost:8000/auth/github/');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
