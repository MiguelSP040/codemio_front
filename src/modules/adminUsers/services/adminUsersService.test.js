import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { listUsers } from './adminUsersService';

vi.mock('axios', () => ({
  default: {
    create: vi.fn(),
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

  it('uses token from codemio_auth storage', async () => {
    localStorage.setItem('codemio_auth', JSON.stringify({ accessToken: 'new-token' }));
    const get = vi.fn().mockResolvedValue({ data: [] });
    axios.create.mockReturnValue({ get });

    await listUsers();

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer new-token',
      },
    });
  });

  it('falls back to legacy auth token format', async () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'legacy-token' }));
    const get = vi.fn().mockResolvedValue({ data: [] });
    axios.create.mockReturnValue({ get });

    await listUsers();

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer legacy-token',
      },
    });
  });
});
