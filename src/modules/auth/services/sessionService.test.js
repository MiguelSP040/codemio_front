import { beforeEach, describe, expect, it } from 'vitest';
import {
  readSession,
  getAccessToken,
  getRefreshToken,
  getSessionEmail,
  saveSessionFromAuthPayload,
  updateTokens,
  setSessionUser,
  clearSession,
} from './sessionService';
import {
  setCurrentSession,
  setLegacySession,
  setupLocalStorageMock,
} from '../../../test/sessionTestUtils';

describe('sessionService', () => {
  beforeEach(() => {
    setupLocalStorageMock();
  });

  describe('readSession', () => {
    it('returns null when nothing stored', () => {
      expect(readSession()).toBeNull();
    });

    it('reads current codemio_auth key', () => {
      setCurrentSession('abc');
      expect(readSession()).toEqual({ accessToken: 'abc' });
    });

    it('falls back to legacy auth key', () => {
      setLegacySession('legacy-token');
      expect(readSession()).toEqual({ token: 'legacy-token' });
    });

    it('returns null when stored json is malformed', () => {
      localStorage.setItem('codemio_auth', '{not json');
      expect(readSession()).toBeNull();
    });
  });

  describe('token accessors', () => {
    it('getAccessToken prefers accessToken, then token, then tokens.access_token', () => {
      localStorage.setItem('codemio_auth', JSON.stringify({ accessToken: 'a' }));
      expect(getAccessToken()).toBe('a');

      localStorage.setItem('codemio_auth', JSON.stringify({ token: 'b' }));
      expect(getAccessToken()).toBe('b');

      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ tokens: { access_token: 'c' } }),
      );
      expect(getAccessToken()).toBe('c');
    });

    it('getAccessToken returns null with no session', () => {
      expect(getAccessToken()).toBeNull();
    });

    it('getRefreshToken reads from refreshToken or tokens.refresh_token', () => {
      localStorage.setItem('codemio_auth', JSON.stringify({ refreshToken: 'r1' }));
      expect(getRefreshToken()).toBe('r1');

      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ tokens: { refresh_token: 'r2' } }),
      );
      expect(getRefreshToken()).toBe('r2');
    });

    it('getSessionEmail prefers user.correo, user.email, then email', () => {
      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ user: { correo: 'a@x.com' } }),
      );
      expect(getSessionEmail()).toBe('a@x.com');

      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ user: { email: 'b@x.com' } }),
      );
      expect(getSessionEmail()).toBe('b@x.com');

      localStorage.setItem('codemio_auth', JSON.stringify({ email: 'c@x.com' }));
      expect(getSessionEmail()).toBe('c@x.com');
    });
  });

  describe('saveSessionFromAuthPayload', () => {
    it('stores tokens and user from auth payload', () => {
      saveSessionFromAuthPayload({
        tokens: { access_token: 'at', refresh_token: 'rt', token_type: 'Bearer', expires_in: 3600 },
        usuario: { correo: 'a@x.com' },
      });
      const stored = JSON.parse(localStorage.getItem('codemio_auth'));
      expect(stored.accessToken).toBe('at');
      expect(stored.refreshToken).toBe('rt');
      expect(stored.email).toBe('a@x.com');
      expect(stored.tokenType).toBe('Bearer');
    });

    it('supports legacy flat token payload', () => {
      saveSessionFromAuthPayload({ token: 'legacy', user: { email: 'b@x.com' } });
      const stored = JSON.parse(localStorage.getItem('codemio_auth'));
      expect(stored.accessToken).toBe('legacy');
      expect(stored.email).toBe('b@x.com');
    });

    it('removes legacy auth key on save', () => {
      setLegacySession('old');
      saveSessionFromAuthPayload({ token: 'new' });
      expect(localStorage.getItem('auth')).toBeNull();
    });

    it('no-ops when no tokens supplied', () => {
      saveSessionFromAuthPayload({});
      expect(localStorage.getItem('codemio_auth')).toBeNull();
    });
  });

  describe('updateTokens', () => {
    it('updates tokens while preserving other session fields', () => {
      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ user: { email: 'x@x.com' }, accessToken: 'old' }),
      );
      updateTokens({ accessToken: 'new', refreshToken: 'nr' });
      const stored = JSON.parse(localStorage.getItem('codemio_auth'));
      expect(stored.accessToken).toBe('new');
      expect(stored.refreshToken).toBe('nr');
      expect(stored.user).toEqual({ email: 'x@x.com' });
    });

    it('keeps existing tokens when args are null/undefined', () => {
      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ accessToken: 'keep', refreshToken: 'also' }),
      );
      updateTokens({ accessToken: null, refreshToken: undefined });
      const stored = JSON.parse(localStorage.getItem('codemio_auth'));
      expect(stored.accessToken).toBe('keep');
      expect(stored.refreshToken).toBe('also');
    });
  });

  describe('setSessionUser', () => {
    it('updates user in an existing session', () => {
      localStorage.setItem(
        'codemio_auth',
        JSON.stringify({ accessToken: 'a', email: 'old@x.com' }),
      );
      setSessionUser({ correo: 'new@x.com' });
      const stored = JSON.parse(localStorage.getItem('codemio_auth'));
      expect(stored.user).toEqual({ correo: 'new@x.com' });
      expect(stored.email).toBe('new@x.com');
    });

    it('no-ops when no session exists', () => {
      setSessionUser({ correo: 'x@x.com' });
      expect(localStorage.getItem('codemio_auth')).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes both current and legacy keys', () => {
      setCurrentSession('a');
      setLegacySession('b');
      clearSession();
      expect(localStorage.getItem('codemio_auth')).toBeNull();
      expect(localStorage.getItem('auth')).toBeNull();
    });
  });
});
