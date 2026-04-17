import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AnalysisStatusCard from '../components/AnalysisStatusCard';
import ProjectDrawer from '../components/ProjectDrawer';
import { getProjectById, updateProject } from '../../projects/services/projectService';
import { listAnalysisRuns } from '../../analysis/services/analysisService';
import LoadingState from '../../../components/ui/LoadingState/LoadingState';
import './DashboardPage.css';

const DEFAULT_REPO_NAME = 'Proyecto';
const RUNS_POLL_INTERVAL_MS = 4000;

function formatDateLabel(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(raw);
  return date.toLocaleString('es-MX');
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return 'N/A';
  return `${Number(value).toFixed(1)}%`;
}

function normalizeQualityGateLabel(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'OK' || normalized === 'PASSED') return 'Aprobado';
  if (normalized === 'WARN' || normalized === 'WARNING') return 'Con observaciones';
  if (normalized === 'ERROR' || normalized === 'FAILED') return 'Fallido';
  if (normalized) return normalized;
  return 'N/A';
}

function severityClass(severity) {
  const normalized = String(severity || '').toUpperCase();
  if (severity === 'Crítico' || normalized === 'CRITICAL' || normalized === 'HIGH') {
    return 'dashboard-badge dashboard-badge--critical';
  }
  if (severity === 'Advertencia' || normalized === 'MEDIUM') {
    return 'dashboard-badge dashboard-badge--warning';
  }
  return 'dashboard-badge dashboard-badge--info';
}

function analysisStatusClass(analysisStatus) {
  if (analysisStatus === 'queued') return 'analysis-status-badge--queued';
  if (analysisStatus === 'processing') return 'analysis-status-badge--processing';
  if (analysisStatus === 'completed_with_warnings') return 'analysis-status-badge--completed';
  if (analysisStatus === 'completed') return 'analysis-status-badge--completed';
  if (analysisStatus === 'canceled') return 'analysis-status-badge--error';
  if (analysisStatus === 'error') return 'analysis-status-badge--error';
  return 'analysis-status-badge--idle';
}

function analysisStatusLabel(analysisStatus) {
  if (analysisStatus === 'queued') return 'En cola';
  if (analysisStatus === 'processing') return 'En proceso';
  if (analysisStatus === 'completed_with_warnings') return 'Completado con observaciones';
  if (analysisStatus === 'completed') return 'Completado';
  if (analysisStatus === 'canceled') return 'Cancelado';
  if (analysisStatus === 'error') return 'Error';
  return 'Sin iniciar';
}

function resolveAnalysisStatus(runStatus, { qualityGateFailed, qualityGateWarn }) {
  if (runStatus === 'DONE') {
    if (qualityGateFailed || qualityGateWarn) return 'completed_with_warnings';
    return 'completed';
  }
  if (runStatus === 'RUNNING') return 'processing';
  if (runStatus === 'CANCELED') return 'canceled';
  if (runStatus === 'FAILED') return 'error';
  return 'queued';
}

function resolveQualityGateMessage(runStatus, { qualityGateFailed, qualityGateWarn }) {
  if (runStatus !== 'DONE') return '';
  if (qualityGateFailed) return 'El análisis terminó, pero no pasó el Quality Gate.';
  if (qualityGateWarn) return 'El análisis terminó con observaciones de calidad.';
  return '';
}

function mapRunToFile(run) {
  const findings = Array.isArray(run?.findings) ? run.findings : [];
  const metrics = run?.metrics || {};
  const bugs = Number(run?.bugs ?? metrics?.bugs ?? 0);
  const vulnerabilities = Number(run?.vulnerabilities ?? metrics?.vulnerabilities ?? 0);
  const codeSmells = Number(run?.code_smells ?? metrics?.code_smells ?? 0);
  const complexity = Number(run?.complexity ?? metrics?.complexity ?? 0);
  const coverage = Number(run?.coverage ?? metrics?.coverage ?? 0);
  const duplicatedDensity = Number(
    run?.duplicated_lines_density ?? metrics?.duplicated_lines_density ?? 0,
  );
  const classesCount = Number(run?.classes_count ?? metrics?.classes_count ?? 0);
  const methodsCount = Number(run?.methods_count ?? metrics?.methods_count ?? 0);
  const parametersCount = Number(run?.parameters_count ?? metrics?.parameters_count ?? 0);
  const inheritanceCount = Number(run?.inheritance_count ?? metrics?.inheritance_count ?? 0);
  const interclassCallsCount = Number(
    run?.interclass_calls_count ?? metrics?.interclass_calls_count ?? 0,
  );
  const fileMetrics = Array.isArray(run?.file_metrics) ? run.file_metrics : [];
  const qualityGate = run?.quality_gate_status || metrics?.quality_gate_status || '';
  const normalizedQualityGate = String(qualityGate || '').toUpperCase();
  const qualityGateFailed = normalizedQualityGate === 'FAILED' || normalizedQualityGate === 'ERROR';
  const qualityGateWarn = normalizedQualityGate === 'WARN' || normalizedQualityGate === 'WARNING';
  const failedMessageRaw =
    run?.status === 'FAILED'
      ? String(run?.error_summary || run?.error_detail || '').trim()
      : '';
  const failedMessage = failedMessageRaw ? failedMessageRaw.split('\n')[0] : '';
  const canceledMessage = run?.status === 'CANCELED' ? 'El análisis fue cancelado.' : '';
  const qualityGateMessage = resolveQualityGateMessage(run?.status, {
    qualityGateFailed,
    qualityGateWarn,
  });
  const statusMessage = failedMessage || canceledMessage || qualityGateMessage;
  const shortDescription = statusMessage
    ? `Estado: ${run.status}. ${statusMessage}`
    : `Estado: ${run.status}. Quality gate: ${normalizeQualityGateLabel(qualityGate)}.`;

  return {
    id: `run-${run.id}`,
    repositoryName: run.original_filename || DEFAULT_REPO_NAME,
    fileName: run.original_filename || `Run ${run.id}`,
    filePath: run.original_filename || '',
    shortDescription,
    score: Math.max(0, 100 - bugs - vulnerabilities - codeSmells),
    analysisStatus: resolveAnalysisStatus(run.status, { qualityGateFailed, qualityGateWarn }),
    lastUpdated: run.finished_at || run.started_at || run.created_at || '',
    failureMessage: statusMessage,
    summaryCards: [
      { label: 'Quality Gate', value: normalizeQualityGateLabel(qualityGate) },
      { label: 'Bugs', value: bugs },
      { label: 'Vulnerabilidades', value: vulnerabilities },
      { label: 'Code smells', value: codeSmells },
      { label: 'Complejidad', value: complexity },
      { label: 'Cobertura', value: formatPercent(coverage) },
      { label: 'Duplicacion', value: formatPercent(duplicatedDensity) },
      { label: 'Clases', value: classesCount },
      { label: 'Metodos', value: methodsCount },
      { label: 'Parametros', value: parametersCount },
      { label: 'Herencias', value: inheritanceCount },
      { label: 'Llamadas entre clases', value: interclassCallsCount },
    ],
    syntaxMetrics: {
      classesCount,
      methodsCount,
      parametersCount,
      inheritanceCount,
      interclassCallsCount,
    },
    fileMetrics: fileMetrics.map((item) => ({
      filePath: item.file_path || '',
      classesCount: Number(item.classes_count || 0),
      methodsCount: Number(item.methods_count || 0),
      parametersCount: Number(item.parameters_count || 0),
      inheritanceCount: Number(item.inheritance_count || 0),
      interclassCallsCount: Number(item.interclass_calls_count || 0),
    })),
    findings: findings.map((finding) => ({
      severity: finding.severity || 'LOW',
      file: finding.file_path || run.original_filename || '',
      rule: finding.rule || finding.finding_type || 'N/A',
      recommendation: finding.message_es || finding.message || 'Sin detalle',
    })),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const isAdmin = (user?.rol || user?.role) === 'admin';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [repositoryName, setRepositoryName] = useState(DEFAULT_REPO_NAME);
  const [projectOwnerEmail, setProjectOwnerEmail] = useState('');
  const [draftName, setDraftName] = useState(DEFAULT_REPO_NAME);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [runsRefreshError, setRunsRefreshError] = useState('');
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadProjectAndRuns() {
      try {
        const [project, runsResponse] = await Promise.all([
          getProjectById(projectId),
          listAnalysisRuns({ projectId, activeOnly: true }),
        ]);
        if (!isMounted) return;
        const projectName = project?.name || DEFAULT_REPO_NAME;
        setRepositoryName(projectName);
        setDraftName(projectName);
        setProjectOwnerEmail(project?.user_email || '');
        const runItems = Array.isArray(runsResponse?.results) ? runsResponse.results : [];
        setRuns(runItems);
        setRunsRefreshError('');
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const msg = data?.detail || data?.message || 'No se pudo cargar el proyecto.';
        setProjectError(msg);
      } finally {
        if (isMounted) setProjectLoading(false);
      }
    }
    loadProjectAndRuns();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const hasInProgressRuns = useMemo(
    () => runs.some((run) => run?.status === 'PENDING' || run?.status === 'RUNNING'),
    [runs],
  );

  useEffect(() => {
    if (!projectId || !hasInProgressRuns) return undefined;
    let isMounted = true;

    const intervalId = setInterval(async () => {
      try {
        const runsResponse = await listAnalysisRuns({ projectId, activeOnly: true });
        if (!isMounted) return;
        const runItems = Array.isArray(runsResponse?.results) ? runsResponse.results : [];
        setRuns(runItems);
        setRunsRefreshError('');
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const msg = data?.detail || data?.message || 'No se pudo refrescar el estado del análisis.';
        setRunsRefreshError(msg);
      }
    }, RUNS_POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [projectId, hasInProgressRuns]);

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

  const runtimeFiles = useMemo(() => runs.map(mapRunToFile), [runs]);
  const projectFiles = useMemo(
    () =>
      runtimeFiles.map((fileItem) => ({
        ...fileItem,
        repositoryName,
      })),
    [repositoryName, runtimeFiles],
  );

  const [selectedFileId, setSelectedFileId] = useState(null);

  useEffect(() => {
    setSelectedFileId(projectFiles[0]?.id || null);
  }, [projectFiles]);

  const selectedAnalysis = useMemo(
    () => projectFiles.find((analysis) => analysis.id === selectedFileId) ?? projectFiles[0] ?? null,
    [projectFiles, selectedFileId],
  );

  return (
    <div className="dashboard-page">
      <ProjectDrawer
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((currentValue) => !currentValue)}
        onClose={() => setIsSidebarOpen(false)}
        analysisFiles={projectFiles}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
        getStatusClass={analysisStatusClass}
        getStatusLabel={analysisStatusLabel}
      />

      <main className="dashboard-main">
        <section className="dashboard-header">
          <div>
            {!isEditingName ? (
              <>
                <div className="dashboard-repo-row">
                  <p className="dashboard-eyebrow">Repositorio {repositoryName}</p>
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
                {isAdmin && projectOwnerEmail ? (
                  <p className="dashboard-subtitle">Propietario del proyecto: {projectOwnerEmail}</p>
                ) : null}
              </>
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
            {projectLoading && <LoadingState inline label="Cargando proyecto..." />}
            {projectError && <p className="dashboard-subtitle">{projectError}</p>}
            {runsRefreshError && <p className="dashboard-subtitle">{runsRefreshError}</p>}
            {selectedAnalysis ? (
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
                {selectedAnalysis.failureMessage ? (
                  <p className="dashboard-subtitle">{selectedAnalysis.failureMessage}</p>
                ) : null}
              </>
            ) : (
              <>
                <div className="dashboard-title-row">
                  <h1>Sin analisis todavia</h1>
                </div>
                <p className="dashboard-subtitle">
                  Sube archivos .java o .zip desde el panel de proyectos para ver resultados Sonar aqui.
                </p>
              </>
            )}
          </div>
          <div className="dashboard-score-card">
            <span className="dashboard-score-label">Score del archivo</span>
            <strong className="dashboard-score-value">
              {selectedAnalysis ? selectedAnalysis.score : 'N/A'}
            </strong>
          </div>
        </section>

        {selectedAnalysis ? (
          <>
            <AnalysisStatusCard
              analysisStatus={selectedAnalysis.analysisStatus}
              lastUpdated={formatDateLabel(selectedAnalysis.lastUpdated)}
            />

            <section className="dashboard-summary-grid" aria-label="Métricas resumen del proyecto">
              {selectedAnalysis.summaryCards.map((item) => (
                <article className="dashboard-summary-card" key={item.label}>
                  <p className="dashboard-summary-label">{item.label}</p>
                  <p className="dashboard-summary-value">{item.value}</p>
                </article>
              ))}
            </section>

            <section className="dashboard-findings" aria-label="Metricas sintacticas por archivo">
              <header className="dashboard-section-header">
                <h2>Metricas sintacticas</h2>
                <p>Clases, metodos, parametros, herencia y llamadas entre clases.</p>
              </header>
              {selectedAnalysis.fileMetrics.length === 0 ? (
                <p className="dashboard-subtitle dashboard-section-empty">
                  No hay detalle sintactico por archivo para este analisis.
                </p>
              ) : (
                <div className="dashboard-findings-table-wrap">
                  <table className="dashboard-findings-table">
                    <thead>
                      <tr>
                        <th>Archivo</th>
                        <th>Clases</th>
                        <th>Metodos</th>
                        <th>Parametros</th>
                        <th>Herencia</th>
                        <th>Llamadas entre clases</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.fileMetrics.map((metric) => (
                        <tr key={metric.filePath}>
                          <td>{metric.filePath}</td>
                          <td>{metric.classesCount}</td>
                          <td>{metric.methodsCount}</td>
                          <td>{metric.parametersCount}</td>
                          <td>{metric.inheritanceCount}</td>
                          <td>{metric.interclassCallsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="dashboard-findings" aria-label="Hallazgos del análisis">
              <header className="dashboard-section-header">
                <h2>Hallazgos</h2>
                <p>Resultados automáticos del análisis Sonar para el archivo seleccionado.</p>
              </header>

              {selectedAnalysis.findings.length === 0 ? (
                <p className="dashboard-subtitle">
                  No hay hallazgos para este análisis.
                </p>
              ) : (
                <div className="dashboard-findings-table-wrap">
                  <table className="dashboard-findings-table">
                    <thead>
                      <tr>
                        <th>Severidad</th>
                        <th>Archivo</th>
                        <th>Regla</th>
                        <th>Recomendación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAnalysis.findings.map((finding, index) => (
                        <tr key={`${finding.file}-${index}`}>
                          <td>
                            <span className={severityClass(finding.severity)}>{finding.severity}</span>
                          </td>
                          <td>{finding.file}</td>
                          <td>{finding.rule}</td>
                          <td>{finding.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
