import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProjectDrawer from './ProjectDrawer';

function buildAnalysis(overrides = {}) {
  return {
    id: 'a1',
    fileName: 'Main.java',
    filePath: 'src/Main.java',
    shortDescription: 'Analizado',
    score: 92,
    analysisStatus: 'completed',
    summaryCards: [{ value: 2 }],
    ...overrides,
  };
}

const baseProps = {
  isOpen: true,
  onToggle: vi.fn(),
  onClose: vi.fn(),
  onSelectFile: vi.fn(),
  getStatusClass: (s) => `status-${s}`,
  getStatusLabel: (s) => `label-${s}`,
};

describe('ProjectDrawer', () => {
  it('renders the analyses list when open', () => {
    render(
      <ProjectDrawer
        {...baseProps}
        analysisFiles={[buildAnalysis({ fileName: 'Foo.java' })]}
        selectedFileId="a1"
      />,
    );

    expect(screen.getByText('Foo')).toBeInTheDocument();
    expect(screen.getByText('Score 92')).toBeInTheDocument();
    expect(screen.getByText('2 críticos')).toBeInTheDocument();
  });

  it('invokes onSelectFile when an item is clicked', () => {
    const onSelectFile = vi.fn();
    render(
      <ProjectDrawer
        {...baseProps}
        analysisFiles={[buildAnalysis()]}
        onSelectFile={onSelectFile}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Main/ }));
    expect(onSelectFile).toHaveBeenCalledWith('a1');
  });

  it('fires onToggle from the collapse button', () => {
    const onToggle = vi.fn();
    render(
      <ProjectDrawer {...baseProps} onToggle={onToggle} analysisFiles={[buildAnalysis()]} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /menu de proyectos/ }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('fires onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(
      <ProjectDrawer {...baseProps} onClose={onClose} analysisFiles={[buildAnalysis()]} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Cerrar panel/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it('hides the backdrop when closed', () => {
    render(
      <ProjectDrawer {...baseProps} isOpen={false} analysisFiles={[buildAnalysis()]} />,
    );
    expect(screen.queryByRole('button', { name: /Cerrar panel/ })).toBeNull();
  });
});
