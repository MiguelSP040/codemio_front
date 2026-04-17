import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import AnalysisStatusCard from '../components/AnalysisStatusCard';
import ProjectDrawer from '../components/ProjectDrawer';
import {
  getAnalysisRuns,
  getProjectById,
  updateProject,
} from '../../projects/services/projectService';
import './DashboardPage.css';

const SEVERITY_ORDER = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const SEVERITY_FILTERS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function severityClass(severity) {
  if (severity === 'CRITICAL') return 'dashboard-badge dashboard-badge--critical';
  if (severity === 'HIGH') return 'dashboard-badge dashboard-badge--warning';
  if (severity === 'MEDIUM') return 'dashboard-badge dashboard-badge--info';
  return 'dashboard-badge dashboard-badge--low';
}

function mapRunStatusToUiStatus(status) {
  if (status === 'PENDING') return 'queued';
  if (status === 'RUNNING') return 'processing';
  if (status === 'DONE') return 'completed';
  if (status === 'FAILED') return 'error';
  if (status === 'CANCELED') return 'idle';
  return 'idle';
}

function analysisStatusClass(analysisStatus) {
  if (analysisStatus === 'queued') return 'analysis-status-badge--queued';
  if (analysisStatus === 'processing') return 'analysis-status-badge--processing';
  if (analysisStatus === 'completed') return 'analysis-status-badge--completed';
  if (analysisStatus === 'error') return 'analysis-status-badge--error';
  return 'analysis-status-badge--idle';
}

function analysisStatusLabel(analysisStatus) {
  if (analysisStatus === 'queued') return 'En cola';
  if (analysisStatus === 'processing') return 'En proceso';
  if (analysisStatus === 'completed') return 'Completado';
  if (analysisStatus === 'error') return 'Error';
  return 'Sin iniciar';
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleString('es-MX');
}

function getSeveritySummary(findings) {
  const summary = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  findings.forEach((finding) => {
    const severity = (finding.severity || '').toUpperCase();
    if (summary[severity] !== undefined) {
      summary[severity] += 1;
    }
  });
  return summary;
}

function normalizeFinding(finding) {
  const severity = (finding.severity || 'LOW').toUpperCase();
  return {
    id: finding.id,
    severity,
    file: finding.file_path || 'Sin ruta',
    rule: finding.rule || 'Sin regla',
    recommendation: finding.message_es || finding.message || 'Sin detalle',
  };
}

function sortFindingsBySeverity(findings) {
  return [...findings].sort((a, b) => {
    const aOrder = SEVERITY_ORDER[a.severity] || 0;
    const bOrder = SEVERITY_ORDER[b.severity] || 0;
    if (aOrder !== bOrder) return bOrder - aOrder;
    return a.rule.localeCompare(b.rule);
  });
}

function mapAnalysisRuns(runItems, projectScoreValue) {
  return runItems.map((run) => {
    const findings = sortFindingsBySeverity(
      Array.isArray(run.findings) ? run.findings.map(normalizeFinding) : [],
    );
    const summary = getSeveritySummary(findings);
    return {
      id: String(run.id),
      fileName: run.original_filename || `Run ${run.id}`,
      filePath: `Corrida #${run.id}`,
      shortDescription: `${run.total_files_analyzed} archivo(s) · ${run.findings_count} hallazgo(s)`,
      score: projectScoreValue ?? 0,
      analysisStatus: mapRunStatusToUiStatus(run.status),
      lastUpdated: formatDateTime(run.finished_at || run.started_at || run.created_at),
      summaryCards: [
        { label: 'CRITICAL', value: summary.CRITICAL },
        { label: 'HIGH', value: summary.HIGH },
        { label: 'MEDIUM', value: summary.MEDIUM },
        { label: 'LOW', value: summary.LOW },
      ],
      findings,
    };
  });
}

export default function DashboardPage() {
  const { projectId } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [repositoryName, setRepositoryName] = useState('Proyecto');
  const [draftName, setDraftName] = useState('Proyecto');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [projectScore, setProjectScore] = useState(0);

  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisRuns, setAnalysisRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    let isMounted = true;
    async function loadProjectAndAnalysis() {
      setProjectLoading(true);
      setAnalysisLoading(true);
      setProjectError('');
      setAnalysisError('');

      try {
        const [project, runsResponse] = await Promise.all([
          getProjectById(projectId),
          getAnalysisRuns({ projectId }),
        ]);
        if (!isMounted) return;

        const projectName = project?.name || 'Proyecto';
        setRepositoryName(projectName);
        setDraftName(projectName);
        setProjectScore(project?.quality_score ?? 0);

        const runItems = Array.isArray(runsResponse?.results) ? runsResponse.results : [];
        const mappedRuns = mapAnalysisRuns(runItems, project?.quality_score ?? 0);

        setAnalysisRuns(mappedRuns);
        setSelectedRunId(mappedRuns[0]?.id || null);
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const msg = data?.detail || data?.message || 'No se pudieron cargar los datos del proyecto.';
        setProjectError(msg);
        setAnalysisError(msg);
      } finally {
        if (!isMounted) return;
        setProjectLoading(false);
        setAnalysisLoading(false);
      }
    }

    loadProjectAndAnalysis();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const selectedAnalysis = useMemo(
    () => analysisRuns.find((run) => run.id === selectedRunId) || analysisRuns[0] || null,
    [analysisRuns, selectedRunId],
  );

  const hasActiveRuns = useMemo(
    () => analysisRuns.some((run) => run.analysisStatus === 'queued' || run.analysisStatus === 'processing'),
    [analysisRuns],
  );

  useEffect(() => {
    if (!hasActiveRuns) return undefined;

    const intervalId = setInterval(async () => {
      try {
        const [project, runsResponse] = await Promise.all([
          getProjectById(projectId),
          getAnalysisRuns({ projectId }),
        ]);

        const updatedScore = project?.quality_score ?? 0;
        const runItems = Array.isArray(runsResponse?.results) ? runsResponse.results : [];
        const mappedRuns = mapAnalysisRuns(runItems, updatedScore);

        setProjectScore(updatedScore);
        setAnalysisRuns(mappedRuns);
        setSelectedRunId((currentRunId) => {
          if (!mappedRuns.length) return null;
          if (currentRunId && mappedRuns.some((run) => run.id === currentRunId)) {
            return currentRunId;
          }
          return mappedRuns[0].id;
        });
      } catch (err) {
        const data = err.response?.data;
        const msg = data?.detail || data?.message || 'No se pudieron refrescar las corridas de análisis.';
        setAnalysisError(msg);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [hasActiveRuns, projectId]);

  useEffect(() => {
    setSeverityFilter('ALL');
  }, [selectedRunId]);

  const summaryCards = useMemo(() => {
    if (!selectedAnalysis) {
      return SEVERITY_FILTERS.map((severity) => ({ label: severity, value: 0 }));
    }
    return selectedAnalysis.summaryCards;
  }, [selectedAnalysis]);

  const filteredFindings = useMemo(() => {
    if (!selectedAnalysis) return [];
    if (severityFilter === 'ALL') return selectedAnalysis.findings;
    return selectedAnalysis.findings.filter((finding) => finding.severity === severityFilter);
  }, [selectedAnalysis, severityFilter]);

  function startEditName() {
    setDraftName(repositoryName);
    setNameError('');
    setIsEditingName(true);
  }

  function cancelEditName() {
    setDraftName(repositoryName);
    setNameError('');
    setIsEditingName(false);
  }

  async function saveProjectName() {
    const normalized = draftName.trim();
    if (normalized.length < 3) {
      setNameError('El nombre del proyecto debe tener al menos 3 caracteres.');
      return;
    }
    if (normalized.length > 100) {
      setNameError('El nombre del proyecto no puede exceder 100 caracteres.');
      return;
    }
    setSavingName(true);
    try {
      const updated = await updateProject(projectId, { name: normalized });
      setRepositoryName(updated?.name || normalized);
      setDraftName(updated?.name || normalized);
      setNameError('');
      setProjectError('');
      setIsEditingName(false);
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (Array.isArray(data?.name) ? data.name[0] : null) ||
        'No se pudo actualizar el proyecto.';
      setNameError(msg);
    } finally {
      setSavingName(false);
    }
  }

  function handleNameKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); saveProjectName(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEditName(); }
  }

  function toggleSeverityFilter(severity) {
    setSeverityFilter((prev) => (prev === severity ? 'ALL' : severity));
  }

  return (
    <div className="dashboard-page">
      <ProjectDrawer
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((currentValue) => !currentValue)}
        onClose={() => setIsSidebarOpen(false)}
        analysisFiles={analysisRuns}
        selectedFileId={selectedAnalysis?.id || null}
        onSelectFile={setSelectedRunId}
        getStatusClass={analysisStatusClass}
        getStatusLabel={analysisStatusLabel}
      />

      <main className="dashboard-main">
        <section className="dashboard-header">
          <div>
            {!isEditingName ? (
              <div className="dashboard-repo-row">
                <p className="dashboard-eyebrow">Proyecto {repositoryName}</p>
                <button
                  type="button"
                  className="dashboard-edit-btn"
                  onClick={startEditName}
                  aria-label="Editar nombre del proyecto"
                  title="Editar nombre"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="dashboard-name-editor">
                <label htmlFor="project-name" className="dashboard-name-label">
                  Nombre del proyecto
                </label>
                <div className="dashboard-name-controls">
                  <input
                    id="project-name"
                    className="dashboard-name-input"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    maxLength={100}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="dashboard-btn dashboard-btn--primary"
                    onClick={saveProjectName}
                    disabled={savingName}
                  >
                    {savingName ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="dashboard-btn dashboard-btn--ghost"
                    onClick={cancelEditName}
                    disabled={savingName}
                  >
                    Cancelar
                  </button>
                </div>
                {nameError && <p className="dashboard-name-error">{nameError}</p>}
              </div>
            )}

            {projectLoading && <p className="dashboard-subtitle">Cargando proyecto...</p>}
            {projectError && <p className="dashboard-subtitle">{projectError}</p>}

            {!analysisLoading && selectedAnalysis && (
              <>
                <div className="dashboard-title-row">
                  <h1>{selectedAnalysis.fileName}</h1>
                  <span
                    className={`analysis-status-badge ${analysisStatusClass(selectedAnalysis.analysisStatus)}`}
                  >
                    {analysisStatusLabel(selectedAnalysis.analysisStatus)}
                  </span>
                </div>
                <p className="dashboard-subtitle">{selectedAnalysis.filePath}</p>
                <p className="dashboard-detail-description">{selectedAnalysis.shortDescription}</p>
              </>
            )}
            {!analysisLoading && !selectedAnalysis && !analysisError && (
              <p className="dashboard-subtitle">Aún no hay corridas de análisis para este proyecto.</p>
            )}
            {analysisError && <p className="dashboard-subtitle">{analysisError}</p>}
          </div>

          <div className="dashboard-score-card">
            <span className="dashboard-score-label">Score del proyecto</span>
            <strong className="dashboard-score-value">{projectScore}</strong>
          </div>
        </section>

        <AnalysisStatusCard
          analysisStatus={selectedAnalysis?.analysisStatus || 'idle'}
          lastUpdated={selectedAnalysis?.lastUpdated}
        />

        <section className="dashboard-summary-grid" aria-label="Métricas resumen del proyecto">
          {summaryCards.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`dashboard-summary-card dashboard-summary-card--clickable${
                severityFilter === item.label ? ' dashboard-summary-card--active' : ''
              }`}
              onClick={() => toggleSeverityFilter(item.label)}
            >
              <p className="dashboard-summary-label">{item.label}</p>
              <p className="dashboard-summary-value">{item.value}</p>
            </button>
          ))}
        </section>

        <section className="dashboard-findings" aria-label="Hallazgos del análisis">
          <header className="dashboard-section-header">
            <h2>Hallazgos</h2>
            <p>
              {severityFilter === 'ALL'
                ? 'Mostrando todas las severidades ordenadas de mayor a menor.'
                : `Filtrando por severidad ${severityFilter}. Haz clic de nuevo para quitar el filtro.`}
            </p>
          </header>

          <div className="dashboard-findings-table-wrap">
            <table className="dashboard-findings-table">
              <thead>
                <tr>
                  <th>Severidad</th>
                  <th>Archivo</th>
                  <th>Regla</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No hay hallazgos para esta selección.</td>
                  </tr>
                ) : (
                  filteredFindings.map((finding) => (
                    <tr key={finding.id}>
                      <td>
                        <span className={severityClass(finding.severity)}>{finding.severity}</span>
                      </td>
                      <td>{finding.file}</td>
                      <td>{finding.rule}</td>
                      <td>{finding.recommendation}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
