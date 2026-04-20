import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Mis proyectos" />);
    expect(screen.getByRole('heading', { name: 'Mis proyectos' })).toBeInTheDocument();
  });

  it('renders eyebrow, description and action when provided', () => {
    render(
      <PageHeader
        title="Tablero"
        eyebrow="Resumen"
        description="Panel principal"
        action={<button type="button">Nuevo</button>}
      />,
    );
    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Panel principal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });

  it('omits optional sections when not provided', () => {
    const { container } = render(<PageHeader title="Only title" />);
    expect(container.querySelector('.page-header-eyebrow')).toBeNull();
    expect(container.querySelector('.page-header-description')).toBeNull();
    expect(container.querySelector('.page-header-actions')).toBeNull();
  });
});
