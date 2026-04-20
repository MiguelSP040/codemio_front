import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import RegisterPage from './RegisterPage';

vi.mock('../services/authService', () => ({
  githubAuth: vi.fn(),
}));

vi.mock('../services/onboardingService', () => ({
  sendVerificationCode: vi.fn(),
}));

vi.mock('../../../assets/images/codemio-logo-completo.png', () => ({
  default: 'logo-stub',
}));

describe('RegisterPage', () => {
  it('renders the email input', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
  });

  it('shows inline validation error on blur with empty email', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    const email = screen.getByLabelText(/correo/i);
    fireEvent.blur(email);
    expect(screen.getByText(/Este campo es obligatorio/)).toBeInTheDocument();
  });

  it('shows invalid-email message on malformed input', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    const email = screen.getByLabelText(/correo/i);
    fireEvent.change(email, { target: { value: 'not-an-email' } });
    fireEvent.blur(email);
    expect(screen.getByText(/correo electrónico válido/i)).toBeInTheDocument();
  });
});
