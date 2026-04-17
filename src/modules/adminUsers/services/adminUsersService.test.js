import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listUsers } from './adminUsersService';
import apiClient from '../../../services/apiClient';
import {
  setCurrentSession,
  setLegacySession,
  setupLocalStorageMock,
} from '../../../test/sessionTestUtils';

vi.mock('../../../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminUsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
  });

  it('calls users endpoint with active session', async () => {
    setCurrentSession('new-token');
    apiClient.get.mockResolvedValue({ data: [] });

    await listUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users/');
  });

  it('calls users endpoint with legacy session payload', async () => {
    setLegacySession('legacy-token');
    apiClient.get.mockResolvedValue({ data: [] });

    await listUsers();

    expect(apiClient.get).toHaveBeenCalledWith('/users/');
  });
});
