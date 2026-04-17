import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAnalysisRun, listAnalysisRuns } from './analysisService';
import apiClient from '../../../services/apiClient';
import { setCurrentSession, setupLocalStorageMock } from '../../../test/sessionTestUtils';

vi.mock('../../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('analysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
  });

  it('throws when session token is missing', async () => {
    await expect(listAnalysisRuns({ projectId: '1' })).rejects.toThrow(
      'Sesion expirada. Inicia sesion nuevamente.',
    );
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('calls analysis endpoint when creating analysis run', async () => {
    setCurrentSession('token-123');
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

  it('sends active_only filter when requested', async () => {
    setCurrentSession('token-123');
    apiClient.get.mockResolvedValue({ data: { results: [] } });

    await listAnalysisRuns({ projectId: 7, status: 'DONE', activeOnly: true });

    expect(apiClient.get).toHaveBeenCalledWith('/analysis/runs/', {
      params: {
        page: 1,
        project_id: 7,
        status: 'DONE',
        active_only: true,
      },
    });
  });
});
