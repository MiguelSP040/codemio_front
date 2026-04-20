import PropTypes from 'prop-types';
import './AnalysisStatusCard.css';

/**
 * @typedef {'idle' | 'queued' | 'processing' | 'completed' | 'completed_with_warnings' | 'canceled' | 'error'} AnalysisStatus
 */

/**
 * @typedef AnalysisStatusCardProps
 * @property {AnalysisStatus} analysisStatus
 * @property {string} [lastUpdated]
 */

/** @type {Record<AnalysisStatus, { label: string, message: string, badgeClass: string, cardClass: string }>} */
// eslint-disable-next-line react-refresh/only-export-components
export const statusConfig = {
  idle: {
    label: 'Sin iniciar',
    message: 'Aún no se ha iniciado ningún análisis.',
    badgeClass: 'analysis-status-badge--idle',
    cardClass: 'analysis-status-card--idle',
  },
  queued: {
    label: 'En cola',
    message: 'El análisis fue enviado y está en espera.',
    badgeClass: 'analysis-status-badge--queued',
    cardClass: 'analysis-status-card--queued',
  },
  processing: {
    label: 'En proceso',
    message: 'El análisis está en proceso. Puedes seguir editando el proyecto.',
    badgeClass: 'analysis-status-badge--processing',
    cardClass: 'analysis-status-card--processing',
  },
  completed: {
    label: 'Completado',
    message: 'El análisis terminó correctamente.',
    badgeClass: 'analysis-status-badge--completed',
    cardClass: 'analysis-status-card--completed',
  },
  completed_with_warnings: {
    label: 'Completado con observaciones',
    message: 'El análisis terminó con observaciones de calidad.',
    badgeClass: 'analysis-status-badge--warning',
    cardClass: 'analysis-status-card--warning',
  },
  canceled: {
    label: 'Cancelado',
    message: 'El análisis fue cancelado antes de completarse.',
    badgeClass: 'analysis-status-badge--canceled',
    cardClass: 'analysis-status-card--canceled',
  },
  error: {
    label: 'Fallo',
    message: 'Ocurrió un error durante el análisis.',
    badgeClass: 'analysis-status-badge--error',
    cardClass: 'analysis-status-card--error',
  },
};

/**
 * @param {AnalysisStatusCardProps} props
 */
export default function AnalysisStatusCard({ analysisStatus, lastUpdated }) {
  const safeStatus = statusConfig[analysisStatus] ? analysisStatus : 'idle';
  const currentStatus = statusConfig[safeStatus];
  const isProcessing = safeStatus === 'processing';

  return (
    <section className={`analysis-status-card ${currentStatus.cardClass}`} aria-live="polite">
      <header className="analysis-status-header">
        <h2>Estado del análisis</h2>
        <span className={`analysis-status-badge ${currentStatus.badgeClass}`}>
          {currentStatus.label}
        </span>
      </header>

      <p className="analysis-status-message">{currentStatus.message}</p>

      {isProcessing && (
        <div className="analysis-status-progress" role="status" aria-label="Análisis en progreso">
          <span className="analysis-status-spinner" aria-hidden="true" />
          <div className="analysis-status-progress-track" aria-hidden="true">
            <span className="analysis-status-progress-bar" />
          </div>
        </div>
      )}

      <p className="analysis-status-updated">
        Última actualización: {lastUpdated || 'Sin registros aún'}
      </p>
    </section>
  );
}

AnalysisStatusCard.propTypes = {
  analysisStatus: PropTypes.oneOf([
    'idle',
    'queued',
    'processing',
    'completed',
    'completed_with_warnings',
    'canceled',
    'error',
  ]),
  lastUpdated: PropTypes.string,
};
