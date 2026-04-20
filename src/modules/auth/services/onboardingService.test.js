import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendVerificationCode,
  resendVerificationCode,
  validateOtp,
  completeProfile,
} from './onboardingService';
import apiClient from '../../../services/apiClient';
import { setCurrentSession, setupLocalStorageMock } from '../../../test/sessionTestUtils';

vi.mock('../../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('./payloadCrypto', () => ({
  encryptProfilePayload: vi.fn(async (payload) => ({ encrypted: true, payload })),
}));

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
  });

  describe('sendVerificationCode', () => {
    it('posts normalized email to /auth/send/', async () => {
      apiClient.post.mockResolvedValue({ data: { sent: true } });
      const result = await sendVerificationCode({ email: 'A@X.com' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/send/', { email: 'a@x.com' });
      expect(result).toEqual({ sent: true });
    });
  });

  describe('resendVerificationCode', () => {
    it('delegates to sendVerificationCode', async () => {
      apiClient.post.mockResolvedValue({ data: { sent: true } });
      await resendVerificationCode({ email: 'x@y.com' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/send/', { email: 'x@y.com' });
    });
  });

  describe('validateOtp', () => {
    it('uses the recovery endpoint when flow is recovery', async () => {
      apiClient.post.mockResolvedValue({ data: { valid: true } });
      await validateOtp({ email: 'A@x.COM', otp: '000000', flow: 'recovery' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password/validate-code/', {
        email: 'a@x.com',
        code: '000000',
      });
    });

    it('uses /auth/validate/ on default flow', async () => {
      apiClient.post.mockResolvedValue({ data: { valid: true } });
      await validateOtp({ email: 'a@x.com', otp: '111111' });
      expect(apiClient.post).toHaveBeenCalledWith('/auth/validate/', {
        email: 'a@x.com',
        otp: '111111',
      });
    });
  });

  describe('completeProfile', () => {
    it('throws 401 when no session token is present', async () => {
      await expect(
        completeProfile({ nombre: 'Ana', edad: 25 }),
      ).rejects.toMatchObject({ response: { status: 401 } });
      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('fetches public key, encrypts payload and patches /users/me/', async () => {
      setCurrentSession('token-abc');
      apiClient.get.mockResolvedValue({ data: { public_key_pem: 'PEM', key_id: 'k' } });
      apiClient.patch.mockResolvedValue({ data: { ok: true } });

      const result = await completeProfile({ nombre: 'Ana', edad: 30, perfil_github: null });

      expect(apiClient.get).toHaveBeenCalledWith('/auth/payload-public-key/');
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/users/me/',
        expect.objectContaining({ encrypted: true }),
      );
      expect(result).toEqual({ ok: true });
    });
  });
});
