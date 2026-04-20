import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../assets/images/codemio-logo.png', () => ({
  default: 'logo-stub',
}));

import { useAuth } from '../../context/AuthContext';

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <Sidebar isOpen={false} onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  it('renders core nav links for a regular user', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Ana' }, logout: vi.fn() });
    renderSidebar();

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Proyectos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Análisis/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Usuarios/i })).toBeNull();
  });

  it('shows the Usuarios link for admin users', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Admin', rol: 'admin' }, logout: vi.fn() });
    renderSidebar();
    expect(screen.getByRole('link', { name: /Usuarios/i })).toBeInTheDocument();
  });

  it('shows user initials in avatar', () => {
    useAuth.mockReturnValue({ user: { nombre: 'Ana Pérez' }, logout: vi.fn() });
    renderSidebar();
    expect(screen.getByTitle('Ana Pérez')).toHaveTextContent('AP');
  });

  it('logs out and navigates to /login when logout is clicked', () => {
    const logout = vi.fn();
    useAuth.mockReturnValue({ user: { nombre: 'Ana' }, logout });
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesión/i }));
    expect(logout).toHaveBeenCalled();
  });

  it('shows the backdrop when open and fires onClose when clicked', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });

    fireEvent.click(screen.getByRole('button', { name: /Cerrar menú/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to the default display name when no user', () => {
    useAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderSidebar();
    expect(screen.getByTitle('Usuario')).toHaveTextContent('U');
  });
});
