import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../context/AuthContext';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>dashboard content</p>} />
          <Route path="/onboarding" element={<p>onboarding content</p>} />
        </Route>
        <Route path="/login" element={<p>login page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when unauthenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, onboardingCompleted: false });
    renderAt('/dashboard');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects to /onboarding when authenticated but onboarding incomplete', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, onboardingCompleted: false });
    renderAt('/dashboard');
    expect(screen.getByText('onboarding content')).toBeInTheDocument();
  });

  it('renders the outlet when fully authenticated', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, onboardingCompleted: true });
    renderAt('/dashboard');
    expect(screen.getByText('dashboard content')).toBeInTheDocument();
  });

  it('allows the onboarding page itself even when onboarding incomplete', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, onboardingCompleted: false });
    renderAt('/onboarding');
    expect(screen.getByText('onboarding content')).toBeInTheDocument();
  });
});
