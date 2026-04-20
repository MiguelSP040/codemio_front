import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminUserDetailPage from './AdminUserDetailPage';

vi.mock('../services/adminUsersService', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

import { getUserById, deleteUser } from '../services/adminUsersService';

function renderAt(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/users/${id}`]}>
      <Routes>
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/users" element={<p>users list</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminUserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a loading indicator while fetching', () => {
    getUserById.mockReturnValue(new Promise(() => {}));
    renderAt();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('renders user detail after a successful fetch', async () => {
    getUserById.mockResolvedValue({
      id: 42,
      nombre: 'Ana',
      correo: 'ana@x.com',
      edad: 25,
      perfil_github: 'danielamr',
      rol: 'user',
      habilitado: true,
    });

    renderAt('42');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    });
    expect(screen.getByText('ana@x.com')).toBeInTheDocument();
  });

  it('shows server error when fetch fails', async () => {
    getUserById.mockRejectedValue({ response: { data: { detail: 'No encontrado' } } });

    renderAt();

    await waitFor(() => {
      expect(screen.getByText(/No encontrado/)).toBeInTheDocument();
    });
  });

  it('opens the delete modal and triggers deleteUser', async () => {
    getUserById.mockResolvedValue({
      id: 1,
      nombre: 'Ana',
      correo: 'ana@x.com',
      edad: 25,
      perfil_github: 'g',
      habilitado: true,
    });
    deleteUser.mockResolvedValue({});

    renderAt();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Ana')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(screen.getAllByRole('button', { name: /Sí, eliminar/ })).not.toHaveLength(0);
  });
});
