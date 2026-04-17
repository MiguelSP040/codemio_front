import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnalysisRun, listAnalysisRuns } from './analysisService';
import apiClient from '../../../services/apiClient';

vi.mock('../../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
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
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('calls analysis endpoint when creating analysis run', async () => {
    localStorage.setItem(
      'codemio_auth',
      JSON.stringify({ accessToken: 'token-123' }),
    );
    apiClient.post.mockResolvedValue({ data: { id: 10 } });

    const file = new Blob(['class Main {}'], { type: 'text/plain' });
    await createAnalysisRun({ projectId: 99, sourceFile: file });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/analysis/runs/',
      expect.any(FormData),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });
});
