import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import ForgotPasswordPage from './ForgotPasswordPage';

vi.mock('../services/authService', () => ({
  forgotPassword: vi.fn(),
}));

vi.mock('../../../assets/images/codemio-logo-completo.png', () => ({
  default: 'logo-stub',
}));

describe('ForgotPasswordPage', () => {
  it('renders the email input', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
  });

  it('shows required error on blur with empty value', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    fireEvent.blur(screen.getByLabelText(/correo/i));
    expect(screen.getByText(/Este campo es obligatorio/)).toBeInTheDocument();
  });

  it('shows invalid-email error when format is wrong', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    const email = screen.getByLabelText(/correo/i);
    fireEvent.change(email, { target: { value: 'broken' } });
    fireEvent.blur(email);
    expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument();
  });
});
