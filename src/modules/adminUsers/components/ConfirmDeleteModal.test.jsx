import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDeleteModal open={false} onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders default title and description when open', () => {
    render(<ConfirmDeleteModal open onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
    expect(screen.getByText(/base de datos local/)).toBeInTheDocument();
  });

  it('uses custom title, description and button text', () => {
    render(
      <ConfirmDeleteModal
        open
        title="Borrar"
        description="Custom desc"
        confirmText="Confirmar borrado"
        cancelText="Atrás"
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByText('Borrar')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar borrado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeInTheDocument();
  });

  it('fires onConfirm and onCancel handlers', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal open onCancel={onCancel} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(onConfirm).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('dismisses via backdrop click', () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDeleteModal open onCancel={onCancel} onConfirm={vi.fn()} />,
    );
    fireEvent.click(container.querySelector('.admin-users-modal-backdrop'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables buttons and shows loading label when loading', () => {
    render(<ConfirmDeleteModal open loading onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Eliminando/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });
});
