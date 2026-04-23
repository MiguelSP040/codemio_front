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
    vi.stubEnv('VITE_API_URL', 'http://localhost:8000/api');
    githubAuth();
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign.mock.calls[0][0]).toMatch(/^https?:\/\/(localhost|127\.0\.0\.1):8000\/auth\/github\/$/);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
