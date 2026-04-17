import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import LoadingState from '../../../components/ui/LoadingState/LoadingState';
import { listAnalysisRuns } from '../services/analysisService';
import './AnalysisRunsPage.css';

const RUN_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'En cola' },
  { value: 'RUNNING', label: 'En proceso' },
  { value: 'DONE', label: 'Completado' },
  { value: 'FAILED', label: 'Fallido' },
  { value: 'CANCELED', label: 'Cancelado' },
];

function formatDate(raw) {
  if (!raw) return 'N/A';
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('es-MX');
}

function qualityGateLabel(value) {
  const normalized = String(value || '').toUpperCase();
  if (!normalized) return 'N/A';
  if (normalized === 'OK' || normalized === 'PASSED') return 'Aprobado';
  if (normalized === 'WARN' || normalized === 'WARNING') return 'Observaciones';
  if (normalized === 'FAILED' || normalized === 'ERROR') return 'Fallido';
  return normalized;
}

function statusClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'DONE') return 'analysis-status-chip analysis-status-chip--done';
  if (normalized === 'RUNNING') return 'analysis-status-chip analysis-status-chip--running';
  if (normalized === 'PENDING') return 'analysis-status-chip analysis-status-chip--pending';
  if (normalized === 'FAILED') return 'analysis-status-chip analysis-status-chip--failed';
  if (normalized === 'CANCELED') return 'analysis-status-chip analysis-status-chip--canceled';
  return 'analysis-status-chip';
}

export default function AnalysisRunsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [runs, setRuns] = useState([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadRuns() {
      setLoading(true);
      setError('');
      try {
        const response = await listAnalysisRuns({
          page,
          status: statusFilter || undefined,
        });
        if (!isMounted) return;
        const items = Array.isArray(response?.results) ? response.results : [];
        setRuns(items);
        setTotalRuns(Number(response?.count || 0));
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const message = data?.detail || data?.message || 'No se pudieron cargar los analisis.';
        setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRuns();
    return () => {
      isMounted = false;
    };
  }, [page, statusFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalRuns / 10)), [totalRuns]);
  const visibleRuns = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return runs;
    return runs.filter((run) => {
      const fileName = String(run?.original_filename || '').toLowerCase();
      const projectLabel = `proyecto #${run?.project_id || ''}`.toLowerCase();
      return fileName.includes(query) || projectLabel.includes(query);
    });
  }, [runs, searchText]);

  const summary = useMemo(() => {
    return {
      total: Number(totalRuns || 0),
      completed: runs.filter((run) => run?.status === 'DONE').length,
      running: runs.filter((run) => run?.status === 'RUNNING' || run?.status === 'PENDING').length,
      failed: runs.filter((run) => run?.status === 'FAILED').length,
    };
  }, [runs, totalRuns]);

  let tableContent = null;
  if (loading) {
    tableContent = <LoadingState label="Cargando analisis..." />;
  } else if (visibleRuns.length === 0) {
    tableContent = <p className="analysis-runs-empty">No hay ejecuciones para el filtro seleccionado.</p>;
  } else {
    tableContent = (
      <table className="analysis-runs-table">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Archivo</th>
            <th>Estado</th>
            <th>Quality Gate</th>
            <th>Hallazgos</th>
            <th>Fecha</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {visibleRuns.map((run) => (
            <tr key={run.id}>
              <td>Proyecto #{run.project_id}</td>
              <td>{run.original_filename || 'N/A'}</td>
              <td>
                <span className={statusClass(run.status)}>{run.status || 'N/A'}</span>
              </td>
              <td>{qualityGateLabel(run.quality_gate_status)}</td>
              <td>{Number(run.findings_count || 0)}</td>
              <td>{formatDate(run.finished_at || run.started_at || run.created_at)}</td>
              <td>
                <Link to={`/projects/${run.project_id}/dashboard`} className="analysis-open-link">
                  Ver dashboard
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="analysis-runs-page">
      <PageHeader
        eyebrow="Monitoreo de ejecuciones"
        title="Analisis"
        description="Revisa el estado y resultados de las corridas de analisis."
      />

      <section className="analysis-runs-toolbar" aria-label="Filtros de analisis">
        <div className="analysis-runs-summary">
          <span>Total: {summary.total}</span>
          <span>Completados: {summary.completed}</span>
          <span>En proceso: {summary.running}</span>
          <span>Fallidos: {summary.failed}</span>
        </div>
        <label htmlFor="analysis-search-filter">
          <span>Buscar</span>
          <input
            id="analysis-search-filter"
            type="search"
            value={searchText}
            placeholder="Archivo o proyecto..."
            onChange={(e) => setSearchText(e.target.value)}
          />
        </label>
        <label htmlFor="analysis-status-filter">
          <span>Estado</span>
          <select
            id="analysis-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {RUN_STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error ? <p className="analysis-runs-error">{error}</p> : null}

      <section className="analysis-runs-table-wrap" aria-label="Listado de ejecuciones">
        {tableContent}
      </section>

      <section className="analysis-runs-pagination" aria-label="Paginacion de analisis">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
          Anterior
        </button>
        <span>
          Pagina {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
        >
          Siguiente
        </button>
      </section>
    </div>
  );
}
