import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import FileUpload from './FileUpload';

vi.mock('../../../utils/toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import toast from '../../../utils/toast';

function makeFile({
  name = 'Main.java',
  size = 1024,
  type = 'text/x-java',
  lastModified = 1,
} = {}) {
  const f = new File(['x'.repeat(size)], name, { type, lastModified });
  // jsdom honors size when content matches; but for controlled size tests
  // we override it explicitly below.
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('FileUpload — dropzone view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the dropzone with project name', () => {
    render(<FileUpload projectName="MiProyecto" />);
    expect(screen.getByLabelText(/Subir archivos al proyecto MiProyecto/i)).toBeInTheDocument();
  });

  it('adds valid files through the hidden input and notifies callback', () => {
    const onFilesChanged = vi.fn();
    const { container } = render(<FileUpload onFilesChanged={onFilesChanged} />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, { target: { files: [makeFile({ name: 'A.java' })] } });

    expect(toast.success).toHaveBeenCalledWith('1 archivo agregado');
    expect(onFilesChanged).toHaveBeenCalled();
    expect(screen.getByText('A.java')).toBeInTheDocument();
  });

  it('reports multiple added files with pluralized toast', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [
          makeFile({ name: 'One.java', lastModified: 1 }),
          makeFile({ name: 'Two.java', lastModified: 2 }),
        ],
      },
    });

    expect(toast.success).toHaveBeenCalledWith('2 archivos agregados');
  });

  it('rejects folder-like entries (size=0, no extension)', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');
    const folder = new File([], 'my-folder', { type: '' });
    Object.defineProperty(folder, 'size', { value: 0 });

    fireEvent.change(input, { target: { files: [folder] } });

    expect(toast.error).toHaveBeenCalledWith(
      'Las carpetas no son soportadas. Selecciona archivos o un .zip.',
    );
  });

  it('flags files with unsupported extensions', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'notes.txt' })] },
    });

    expect(toast.error).toHaveBeenCalledWith('1 archivo no cumple con los requisitos');
    expect(screen.getByText(/Formato no soportado/)).toBeInTheDocument();
  });

  it('flags empty files', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'Empty.java', size: 0 })] },
    });

    expect(screen.getByText(/El archivo está vacío/)).toBeInTheDocument();
  });

  it('flags files larger than the limit', () => {
    const { container } = render(<FileUpload maxFileSizeMB={1} />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'Big.java', size: 2 * 1024 * 1024 })] },
    });

    expect(screen.getByText(/Excede el tamaño máximo/)).toBeInTheDocument();
  });

  it('rejects mixing .java with a .zip', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'A.java', lastModified: 1 })] },
    });
    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'B.zip', type: 'application/zip', lastModified: 2 })] },
    });

    expect(toast.warning).toHaveBeenCalledWith('No puedes combinar archivos .java con un .zip.');
  });

  it('rejects a second .zip', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [makeFile({ name: 'A.zip', type: 'application/zip', lastModified: 1 })],
      },
    });
    fireEvent.change(input, {
      target: {
        files: [makeFile({ name: 'B.zip', type: 'application/zip', lastModified: 2 })],
      },
    });

    expect(toast.warning).toHaveBeenCalledWith('Solo puedes subir un archivo .zip a la vez.');
  });

  it('omits duplicates', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');

    const file = makeFile({ name: 'A.java', lastModified: 1 });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.change(input, { target: { files: [file] } });

    expect(toast.info).toHaveBeenCalledWith('Se omitió 1 archivo duplicado');
  });

  it('supports keyboard activation (Enter) on the dropzone', () => {
    const { container } = render(<FileUpload />);
    const input = container.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    const zone = screen.getByLabelText(/Arrastra archivos/i);

    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();

    clickSpy.mockClear();
    fireEvent.keyDown(zone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles drag enter/leave toggling the active state', () => {
    const { container } = render(<FileUpload />);
    const zone = container.querySelector('.fu-dropzone');

    fireEvent.dragEnter(zone, { dataTransfer: { items: [{}] } });
    expect(zone.className).toMatch(/fu-dropzone--active/);

    fireEvent.dragLeave(zone, { dataTransfer: { items: [{}] } });
    expect(zone.className).not.toMatch(/fu-dropzone--active/);
  });

  it('accepts files via drop', () => {
    const { container } = render(<FileUpload />);
    const zone = container.querySelector('.fu-dropzone');

    fireEvent.drop(zone, {
      dataTransfer: { files: [makeFile({ name: 'Dropped.java' })] },
    });

    expect(screen.getByText('Dropped.java')).toBeInTheDocument();
  });

  it('ignores DnD when disabled', () => {
    const { container } = render(<FileUpload disabled />);
    const zone = container.querySelector('.fu-dropzone');

    fireEvent.drop(zone, {
      dataTransfer: { files: [makeFile({ name: 'Dropped.java' })] },
    });

    expect(screen.queryByText('Dropped.java')).toBeNull();
  });
});

describe('FileUpload — filelist view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupWithFile() {
    const result = render(<FileUpload onFilesReady={vi.fn()} onFilesChanged={vi.fn()} />);
    const input = result.container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'A.java', lastModified: 1 })] },
    });
    return result;
  }

  it('submits via onSubmit when provided, preferring it over onFilesReady', () => {
    const onSubmit = vi.fn();
    const onFilesReady = vi.fn();
    const { container } = render(
      <FileUpload onSubmit={onSubmit} onFilesReady={onFilesReady} />,
    );
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'A.java', lastModified: 1 })] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Subir archivos/ }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onFilesReady).not.toHaveBeenCalled();
  });

  it('falls back to onFilesReady when onSubmit is absent', () => {
    const onFilesReady = vi.fn();
    const { container } = render(<FileUpload onFilesReady={onFilesReady} />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: { files: [makeFile({ name: 'A.java', lastModified: 1 })] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Subir archivos/ }));

    expect(onFilesReady).toHaveBeenCalledTimes(1);
  });

  it('disables submit when total exceeds maxTotalSizeMB', () => {
    const { container } = render(<FileUpload maxTotalSizeMB={1} maxFileSizeMB={5} />);
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input, {
      target: {
        files: [makeFile({ name: 'A.java', size: 2 * 1024 * 1024, lastModified: 1 })],
      },
    });

    const submit = screen.getByRole('button', { name: /Subir archivos/ });
    expect(submit).toBeDisabled();
  });

  it('removes a file with animation and notifies', () => {
    setupWithFile();

    fireEvent.click(screen.getByRole('button', { name: /Quitar A.java/ }));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('A.java')).toBeNull();
    expect(toast.message).toHaveBeenCalledWith('Archivo eliminado', { duration: 1800 });
  });

  it('clears all files after confirming in the modal', () => {
    setupWithFile();

    fireEvent.click(screen.getByRole('button', { name: /Quitar todos los archivos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByText('A.java')).toBeNull();
    expect(toast.info).toHaveBeenCalledWith('Selección limpiada');
  });

  it('keeps files when the clear-all modal is canceled', () => {
    setupWithFile();

    fireEvent.click(screen.getByRole('button', { name: /Quitar todos los archivos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('A.java')).toBeInTheDocument();
  });

  it('limits selection to one file when multiple=false', () => {
    const { container } = render(<FileUpload multiple={false} />);
    const input = container.querySelector('input[type="file"]');

    fireEvent.change(input, {
      target: {
        files: [
          makeFile({ name: 'A.java', lastModified: 1 }),
          makeFile({ name: 'B.java', lastModified: 2 }),
        ],
      },
    });

    expect(screen.getByText('A.java')).toBeInTheDocument();
    expect(screen.queryByText('B.java')).toBeNull();
  });
});
