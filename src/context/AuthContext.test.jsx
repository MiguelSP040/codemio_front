import { act, render, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import {
  setCurrentSession,
  setupLocalStorageMock,
} from '../test/sessionTestUtils';
import { getSocialSession } from '../modules/auth/services/authService';

vi.mock('../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('../modules/auth/services/authService', () => ({
  getSocialSession: vi.fn().mockRejectedValue(new Error('no social session')),
  logoutSocialSession: vi.fn().mockResolvedValue({ detail: 'ok' }),
}));

function wrapper({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    vi.unstubAllEnvs();
  });

  it('useAuth throws when used outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider',
    );
  });

  it('hydrates initial state from an existing session', () => {
    localStorage.setItem(
      'codemio_auth',
      JSON.stringify({
        accessToken: 'tok-1',
        refreshToken: 'rtok-1',
        user: { email: 'a@x.com', onboarding_completed: true },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('tok-1');
    expect(result.current.refreshToken).toBe('rtok-1');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.onboardingCompleted).toBe(true);
  });

  it('reports unauthenticated state when storage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('loginAuth persists session and updates state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.loginAuth({
        tokens: { access_token: 'new-tok', refresh_token: 'new-rt' },
        usuario: { email: 'x@y.com' },
      });
    });

    expect(result.current.token).toBe('new-tok');
    expect(result.current.refreshToken).toBe('new-rt');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('setUser updates the current user and keeps the token', () => {
    setCurrentSession('tok');
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setUser({ correo: 'new@x.com', onboarding_completed: true });
    });

    expect(result.current.user).toEqual({
      correo: 'new@x.com',
      onboarding_completed: true,
    });
    expect(result.current.onboardingCompleted).toBe(true);
  });

  it('logout clears session and resets state', () => {
    setCurrentSession('tok');
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('codemio_auth')).toBeNull();
  });

  it('reacts to the codemio:auth-expired window event', async () => {
    setCurrentSession('tok');
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      globalThis.dispatchEvent(new Event('codemio:auth-expired'));
    });

    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('codemio_auth')).toBeNull();
  });

  it('renders children through the provider', () => {
    const { getByText } = render(
      <AuthProvider>
        <p>hola</p>
      </AuthProvider>,
    );
    expect(getByText('hola')).toBeInTheDocument();
  });

  it('emite logs de debug cuando falla social bootstrap', async () => {
    vi.stubEnv('VITE_SOCIAL_AUTH_DEBUG_LOGS', 'true');
    getSocialSession.mockRejectedValueOnce(new Error('network down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AuthProvider>
        <p>hola</p>
      </AuthProvider>,
    );
    await act(async () => {});
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
