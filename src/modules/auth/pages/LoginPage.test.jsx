import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginPage from './LoginPage';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ loginAuth: vi.fn() }),
}));

vi.mock('../services/authService', () => ({
  login: vi.fn(),
  githubAuth: vi.fn(),
}));

vi.mock('../../../assets/images/codemio-logo-completo.png', () => ({
  default: 'logo-stub',
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the email and password inputs', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('surfaces inline validation on blur with an empty email', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const email = screen.getByLabelText(/correo/i);
    fireEvent.blur(email, { target: { name: 'email', value: '' } });

    expect(screen.getByText(/Este campo es obligatorio/)).toBeInTheDocument();
  });

  it('accepts typing into email and password fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const email = screen.getByLabelText(/correo/i);
    fireEvent.change(email, { target: { name: 'email', value: 'test@x.com' } });
    expect(email.value).toBe('test@x.com');
  });
});
