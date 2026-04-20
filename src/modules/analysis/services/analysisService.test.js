import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAnalysisRun,
  fetchAnalysisRunsStatusBulk,
  fetchRunsStateMapForTrackedIds,
  getAnalysisRunStatus,
  listAnalysisRuns,
} from './analysisService';
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

  it('fetches analysis run status endpoint', async () => {
    setCurrentSession('token-123');
    apiClient.get.mockResolvedValue({ data: { id: 3, status: 'RUNNING' } });

    await getAnalysisRunStatus(3);

    expect(apiClient.get).toHaveBeenCalledWith('/analysis/runs/3/status/');
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

  it('fetches status_bulk in one request', async () => {
    setCurrentSession('token-123');
    apiClient.get.mockResolvedValue({
      data: [
        { id: 1, status: 'WAITING_SONAR_WEBHOOK', quality_gate_status: '' },
        { id: 2, status: 'DONE', quality_gate_status: 'OK' },
      ],
    });

    const map = await fetchAnalysisRunsStatusBulk([1, 2]);

    expect(apiClient.get).toHaveBeenCalledWith('/analysis/runs/status_bulk/', {
      params: { ids: '1,2' },
    });
    expect(map.get(1)?.status).toBe('WAITING_SONAR_WEBHOOK');
    expect(map.get(2)?.status).toBe('DONE');
  });

  it('fetchRunsStateMapForTrackedIds prefers status_bulk', async () => {
    setCurrentSession('token-123');
    apiClient.get.mockResolvedValueOnce({
      data: [{ id: 5, status: 'RUNNING', quality_gate_status: '' }],
    });

    const map = await fetchRunsStateMapForTrackedIds(10, [5]);

    expect(apiClient.get).toHaveBeenCalledWith('/analysis/runs/status_bulk/', {
      params: { ids: '5' },
    });
    expect(map.get(5)?.status).toBe('RUNNING');
  });
});
