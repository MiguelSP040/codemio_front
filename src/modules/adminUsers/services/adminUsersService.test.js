import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listUsers } from './adminUsersService';
import apiClient from '../../../services/apiClient';

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }
}

describe('adminUsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage = new LocalStorageMock();
  });

  it('calls users endpoint with active session', async () => {
    localStorage.setItem('codemio_auth', JSON.stringify({ accessToken: 'new-token' }));
    apiClient.get.mockResolvedValue({ data: [] });

    await listUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users/');
  });

  it('calls users endpoint with legacy session payload', async () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'legacy-token' }));
    apiClient.get.mockResolvedValue({ data: [] });

    await listUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users/');
  });
});
