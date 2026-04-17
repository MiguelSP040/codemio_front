import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { createAnalysisRun, listAnalysisRuns } from './analysisService';

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

describe('analysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.localStorage = new LocalStorageMock();
  });

  it('throws when session token is missing', async () => {
    await expect(listAnalysisRuns({ projectId: '1' })).rejects.toThrow(
      'Sesion expirada. Inicia sesion nuevamente.',
    );
    expect(axios.create).not.toHaveBeenCalled();
  });

  it('sends bearer token when creating analysis run', async () => {
    localStorage.setItem(
      'codemio_auth',
      JSON.stringify({ accessToken: 'token-123' }),
    );
    const post = vi.fn().mockResolvedValue({ data: { id: 10 } });
    axios.create.mockReturnValue({ post });

    const file = new Blob(['class Main {}'], { type: 'text/plain' });
    await createAnalysisRun({ projectId: 99, sourceFile: file });

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: expect.any(String),
      headers: { Authorization: 'Bearer token-123' },
    });
    expect(post).toHaveBeenCalledOnce();
  });
});
