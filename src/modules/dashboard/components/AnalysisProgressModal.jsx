import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './AnalysisProgressModal.css';

const STATUS_LABELS = {
  uploading: 'Subiendo...',
  queued: 'En cola',
  running: 'Analizando',
  done: 'Completado',
  done_warn: 'Con observaciones',
  failed: 'Fallido',
  canceled: 'Cancelado',
};

const STATUS_CLASS = {
  uploading: 'apm-chip apm-chip--uploading',
  queued: 'apm-chip apm-chip--queued',
  running: 'apm-chip apm-chip--running',
  done: 'apm-chip apm-chip--done',
  done_warn: 'apm-chip apm-chip--warn',
  failed: 'apm-chip apm-chip--failed',
  canceled: 'apm-chip apm-chip--canceled',
};

function isTerminal(status) {
  return status === 'done' || status === 'done_warn' || status === 'failed' || status === 'canceled';
}

function pickHeadline({ allDone, anyFailed }) {
  if (!allDone) return 'Analizando tus archivos...';
  if (anyFailed) return 'Análisis terminado con errores';
  return 'Análisis completado';
}

function pickSubtitle({ allDone, anyFailed }) {
  if (!allDone) return 'Puedes cerrar esta ventana y el análisis continuará en segundo plano.';
  if (anyFailed) return 'Algunos archivos no se pudieron analizar. Revisa el detalle abajo.';
  return 'Todos los archivos fueron analizados correctamente.';
}

/* Each upload moves through discrete states — uploading, queued, running,
   done. Giving each state partial credit keeps the progress bar alive so the
   user sees movement before the first file finishes, instead of a stuck 0%. */
const ITEM_WEIGHT = {
  uploading: 0.2,
  queued: 0.35,
  running: 0.65,
  done: 1,
  done_warn: 1,
  failed: 1,
  canceled: 1,
};

export default function AnalysisProgressModal({
  open,
  items = [],
  onClose,
  onGoToDashboard,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const total = items.length;
  const completed = items.filter((item) => isTerminal(item.status)).length;
  const weighted = items.reduce(
    (acc, item) => acc + (ITEM_WEIGHT[item.status] ?? 0),
    0,
  );
  const percent = total === 0 ? 0 : Math.min(100, Math.round((weighted / total) * 100));
  const allDone = total > 0 && completed === total;
  const anyFailed = items.some((item) => item.status === 'failed');
  const anyRunning = items.some(
    (item) => item.status === 'uploading' || item.status === 'queued' || item.status === 'running',
  );

  const headline = pickHeadline({ allDone, anyFailed });
  const subtitle = pickSubtitle({ allDone, anyFailed });

  const content = (
    <div className="apm-overlay">
      <dialog
        ref={cardRef}
        className="apm-card"
        open
        aria-labelledby="apm-title"
      >
        <header className="apm-header">
          <h2 id="apm-title" className="apm-title">{headline}</h2>
          <p className="apm-subtitle">{subtitle}</p>
        </header>

        <section className="apm-progress" aria-label="Progreso del análisis">
          <div className="apm-progress-info">
            <span className="apm-progress-count">
              {completed} de {total} completados
            </span>
            <span className="apm-progress-percent">{percent}%</span>
          </div>
          <div
            className={`apm-progress-bar${anyRunning ? ' apm-progress-bar--active' : ''}`}
            aria-hidden="true"
          >
            <div className="apm-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </section>

        <section className="apm-list" aria-label="Estado de cada archivo">
          <ul className="apm-items">
            {items.map((item) => (
              <li key={item.tempId} className="apm-item">
                <span className="apm-item-name" title={item.fileName}>
                  {item.fileName}
                </span>
                <span className={STATUS_CLASS[item.status] || 'apm-chip'}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </li>
            ))}
          </ul>
          {items.some((item) => item.error) ? (
            <ul className="apm-errors">
              {items
                .filter((item) => item.error)
                .map((item) => (
                  <li key={`err-${item.tempId}`}>
                    <strong>{item.fileName}:</strong> {item.error}
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <footer className="apm-actions">
          <button
            type="button"
            className="apm-btn apm-btn--ghost"
            onClick={onClose}
          >
            {allDone ? 'Cerrar' : 'Cerrar (continúa en segundo plano)'}
          </button>
          {allDone && typeof onGoToDashboard === 'function' ? (
            <button
              type="button"
              className="apm-btn apm-btn--primary"
              onClick={onGoToDashboard}
            >
              Ir al dashboard
            </button>
          ) : null}
        </footer>
      </dialog>
    </div>
  );

  return createPortal(content, document.body);
}

AnalysisProgressModal.propTypes = {
  open: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape({
    tempId: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
  })),
  onClose: PropTypes.func.isRequired,
  onGoToDashboard: PropTypes.func,
};
