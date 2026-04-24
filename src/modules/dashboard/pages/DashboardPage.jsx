import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import AnalysisStatusCard from '../components/AnalysisStatusCard';
import ProjectDrawer from '../components/ProjectDrawer';
import { getProjectById, updateProject } from '../../projects/services/projectService';
import {
  fetchAnalysisRunsStatusBulk,
  isRetriableAnalysisError,
  listAnalysisRuns,
} from '../../analysis/services/analysisService';
import { useAnalysisRunsPoll } from '../../../hooks/useAnalysisRunsPoll';
import LoadingState from '../../../components/ui/LoadingState/LoadingState';
import { validateProjectName } from '../../../utils/validation';
import { analysisDashboardLog } from '../../../utils/analysisInstrumentation';
import humanizeErrorMessage from '../../../utils/errorMessages';
import './DashboardPage.css';

const DEFAULT_REPO_NAME = 'Proyecto';
const RUNS_POLL_FAST_MS = 3000;
const RUNS_POLL_SLOW_MS = 8000;
const RUNS_POLL_WEBHOOK_MS = 40000;

const IN_FLIGHT_RUN_STATUSES = new Set(['PENDING', 'RUNNING', 'WAITING_SONAR_WEBHOOK']);

function runProgressSignature(run) {
  if (run?.id == null) return '';
  return [
    run.id,
    run.status,
    run.quality_gate_status,
    run.findings_count,
    run.finished_at,
    run.error_summary,
  ].join('|');
}

function extractErrorMessage(err, fallback) {
  const data = err?.response?.data;
  return data?.detail || data?.message || fallback;
}

function collectInFlightRunIds(runs) {
  return runs
    .filter((r) => IN_FLIGHT_RUN_STATUSES.has(String(r?.status || '').toUpperCase()))
    .map((r) => r.id)
    .filter((id) => id != null);
}

function hasInFlightStatus(rowsIterable) {
  return [...rowsIterable].some((row) => {
    const s = String(row?.status || '').toUpperCase();
    return s === 'PENDING' || s === 'RUNNING';
  });
}

function hasWaitingWebhookStatus(rowsIterable) {
  return [...rowsIterable].some((row) =>
    String(row?.status || '').toUpperCase() === 'WAITING_SONAR_WEBHOOK',
  );
}

function resolveRunsPollBackoff(errorCount, err) {
  if (isRetriableAnalysisError(err)) {
    return Math.min(60000, RUNS_POLL_SLOW_MS * 2 ** Math.min(errorCount, 5));
  }
  return Math.min(30000, RUNS_POLL_SLOW_MS * 2 ** Math.min(errorCount, 4));
}

function renderDashboardHeaderContent({
  isEditingName,
  repositoryName,
  startEditName,
  isAdmin,
  projectOwnerEmail,
  draftName,
  setDraftName,
  handleNameKeyDown,
  saveProjectName,
  savingName,
  cancelEditName,
  nameError,
  projectLoading,
  projectError,
  runsRefreshError,
  selectedAnalysis,
}) {
  return (
    <div>
      {isEditingName ? (
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
              maxLength={49}
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
      ) : (
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
      )}
      {projectLoading && <LoadingState inline label="Cargando proyecto…" />}
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
  );
}

function renderDashboardAnalysisSections({
  selectedAnalysis,
  projectFiles,
  selectedFileId,
  handleSelectFile,
}) {
  if (!selectedAnalysis) return null;

  const qualityGateCard = selectedAnalysis.summaryCards.find((item) => item.label === 'Quality Gate');
  const coverageCard = selectedAnalysis.healthCards.find((item) => item.label === 'Cobertura');
  const duplicationCard = selectedAnalysis.healthCards.find((item) => item.label === 'Duplicacion');

  const parsePercent = (value) => {
    const parsed = Number.parseFloat(String(value ?? '').replace('%', '').trim());
    return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0;
  };

  const coveragePercent = parsePercent(coverageCard?.value);
  const duplicationPercent = parsePercent(duplicationCard?.value);

  const syntaxSummaryItems = [
    { label: 'Clases', value: selectedAnalysis.syntaxMetrics.classesCount },
    { label: 'Metodos', value: selectedAnalysis.syntaxMetrics.methodsCount },
    { label: 'Parametros', value: selectedAnalysis.syntaxMetrics.parametersCount },
    { label: 'Herencias', value: selectedAnalysis.syntaxMetrics.inheritanceCount },
    { label: 'Llamadas entre clases', value: selectedAnalysis.syntaxMetrics.interclassCallsCount },
  ];

  return (
    <>
      {projectFiles.length > 1 && (
        <section
          className="dashboard-file-tabs"
          aria-label="Archivos analizados en este proyecto"
        >
          <p className="dashboard-file-tabs-label">
            Archivos analizados ({projectFiles.length})
          </p>
          <div className="dashboard-file-tabs-list" role="tablist">
            {projectFiles.map((file) => {
              const isActive = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`dashboard-file-tab${isActive ? ' dashboard-file-tab--active' : ''}`}
                  onClick={() => handleSelectFile(file.id)}
                  title={file.fileName}
                >
                  <span className="dashboard-file-tab-name">{file.fileName}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <AnalysisStatusCard
        analysisStatus={selectedAnalysis.analysisStatus}
        lastUpdated={formatDateLabel(selectedAnalysis.lastUpdated)}
      />

      <section className="dashboard-overview-grid" aria-label="Resumen principal del análisis">
        <article className="dashboard-overview-card">
          <p className="dashboard-overview-label">Quality Gate</p>
          <p className="dashboard-overview-value">{qualityGateCard?.value ?? 'N/A'}</p>
        </article>
        <article className="dashboard-overview-card">
          <p className="dashboard-overview-label">Score del archivo</p>
          <p className="dashboard-overview-value">{selectedAnalysis.score}</p>
        </article>
      </section>

      <section className="dashboard-health-grid" aria-label="Indicadores clave del análisis">
        <article className="dashboard-health-card">
          <div className="dashboard-health-top">
            <span>Cobertura</span>
            <strong>{coverageCard?.value ?? '0.0%'}</strong>
          </div>
          <div className="dashboard-health-meter" aria-hidden="true">
            <div className="dashboard-health-meter-fill dashboard-health-meter-fill--coverage" style={{ width: `${coveragePercent}%` }} />
          </div>
        </article>

        <article className="dashboard-health-card">
          <div className="dashboard-health-top">
            <span>Duplicacion</span>
            <strong>{duplicationCard?.value ?? '0.0%'}</strong>
          </div>
          <div className="dashboard-health-meter" aria-hidden="true">
            <div className="dashboard-health-meter-fill dashboard-health-meter-fill--duplication" style={{ width: `${duplicationPercent}%` }} />
          </div>
        </article>
      </section>

      <section className="dashboard-findings" aria-label="Desglose por herramienta">
        <header className="dashboard-section-header">
          <h2>Desglose por herramienta</h2>
          <p>Resumen de hallazgos por Semgrep, Lizard, javalang, PMD y SpotBugs.</p>
        </header>
        <div className="dashboard-severity-legend" role="note" aria-label="Guía de severidades">
          <span><strong>Crítico:</strong> Riesgo alto que requiere corrección prioritaria.</span>
          <span><strong>Alto:</strong> Problema importante que puede afectar calidad o seguridad.</span>
          <span><strong>Medio:</strong> Hallazgo relevante, recomendable atender pronto.</span>
          <span><strong>Bajo:</strong> Mejora menor o recomendación de estilo/mantenimiento.</span>
        </div>
        <div className="dashboard-tool-grid">
          {selectedAnalysis.toolSummary.map((toolItem) => (
            <article key={toolItem.tool} className="dashboard-tool-card">
              <div className="dashboard-tool-card-head">
                <h3>{toolItem.displayName}</h3>
                <strong>{toolItem.totalFindings}</strong>
              </div>
              <p className="dashboard-tool-meta">
                Archivos afectados: {toolItem.affectedFilesCount}
              </p>
              <div className="dashboard-tool-severity">
                <span>Crítico: {toolItem.bySeverity.critical}</span>
                <span>Alto: {toolItem.bySeverity.high}</span>
                <span>Medio: {toolItem.bySeverity.medium}</span>
                <span>Bajo: {toolItem.bySeverity.low}</span>
              </div>
              {toolItem.topRules.length > 0 ? (
                <ul className="dashboard-tool-rules">
                  {toolItem.topRules.map((ruleItem) => (
                    <li key={`${toolItem.tool}-${ruleItem.rule}`}>
                      <span title={ruleItem.rule}>{ruleItem.rule}</span>
                      <strong>{ruleItem.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dashboard-tool-empty">Sin hallazgos.</p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-summary-grid" aria-label="Métricas resumen del proyecto">
        {selectedAnalysis.summaryCards.map((item) => (
          <article className="dashboard-summary-card" key={item.label}>
            <p className="dashboard-summary-label">{item.label}</p>
            <p className="dashboard-summary-value">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-findings" aria-label="Resumen sintactico del análisis">
        <header className="dashboard-section-header">
          <h2>Resumen sintactico</h2>
          <p>Vista compacta de clases, metodos, parametros, herencia y llamadas entre clases.</p>
        </header>
        <div className="dashboard-syntax-summary-grid">
          {syntaxSummaryItems.map((item) => (
            <article key={item.label} className="dashboard-syntax-summary-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
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
                  <th>Complejidad estimada</th>
                  <th>Detalle</th>
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
                    <td>{metric.bigOHint || 'Desconocida'}</td>
                    <td>{metric.bigOReason || 'Sin evidencia suficiente.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function mergeRunsFromStatusPoll(prevRuns, statusById) {
  if (!Array.isArray(prevRuns) || prevRuns.length === 0) return prevRuns;
  let changed = false;
  const next = prevRuns.map((run) => {
    const sid = run?.id;
    if (sid == null) return run;
    const inc = statusById.get(sid);
    if (!inc || typeof inc !== 'object') return run;
    const merged = { ...run, ...inc };
    if (runProgressSignature(run) !== runProgressSignature(merged)) {
      changed = true;
      return merged;
    }
    return run;
  });
  return changed ? next : prevRuns;
}

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

function analysisStatusClass(analysisStatus) {
  if (analysisStatus === 'queued') return 'analysis-status-badge--queued';
  if (analysisStatus === 'processing') return 'analysis-status-badge--processing';
  if (analysisStatus === 'completed_with_warnings') return 'analysis-status-badge--warning';
  if (analysisStatus === 'completed') return 'analysis-status-badge--completed';
  if (analysisStatus === 'canceled') return 'analysis-status-badge--canceled';
  if (analysisStatus === 'error') return 'analysis-status-badge--error';
  return 'analysis-status-badge--idle';
}

function analysisStatusLabel(analysisStatus) {
  if (analysisStatus === 'queued') return 'En cola';
  if (analysisStatus === 'processing') return 'En proceso';
  if (analysisStatus === 'completed_with_warnings') return 'Completado con observaciones';
  if (analysisStatus === 'completed') return 'Completado';
  if (analysisStatus === 'canceled') return 'Cancelado';
  if (analysisStatus === 'error') return 'Análisis fallido';
  return 'Sin iniciar';
}

function resolveAnalysisStatus(runStatus, { qualityGateFailed, qualityGateWarn }) {
  const rs = String(runStatus || '').toUpperCase();
  if (rs === 'DONE') {
    if (qualityGateFailed || qualityGateWarn) return 'completed_with_warnings';
    return 'completed';
  }
  if (rs === 'RUNNING' || rs === 'WAITING_SONAR_WEBHOOK') return 'processing';
  if (rs === 'CANCELED') return 'canceled';
  if (rs === 'FAILED') return 'error';
  return 'queued';
}

function resolveQualityGateMessage(runStatus, { qualityGateFailed, qualityGateWarn }) {
  if (runStatus !== 'DONE') return '';
  if (qualityGateFailed) return 'El análisis terminó, pero no pasó el Quality Gate.';
  if (qualityGateWarn) return 'El análisis terminó con observaciones de calidad.';
  return '';
}

function mapRunToFile(run) {
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
  const ncloc = Number(run?.ncloc ?? metrics?.ncloc ?? 0);
  const reliabilityRating = Number(run?.reliability_rating ?? metrics?.reliability_rating ?? 0);
  const securityRating = Number(run?.security_rating ?? metrics?.security_rating ?? 0);
  const maintainabilityRating = Number(
    run?.maintainability_rating ?? metrics?.maintainability_rating ?? 0,
  );
  const qualityGate = run?.quality_gate_status || metrics?.quality_gate_status || '';
  const normalizedQualityGate = String(qualityGate || '').toUpperCase();
  const qualityGateFailed = normalizedQualityGate === 'FAILED' || normalizedQualityGate === 'ERROR';
  const qualityGateWarn = normalizedQualityGate === 'WARN' || normalizedQualityGate === 'WARNING';
  const failedMessageRaw =
    run?.status === 'FAILED'
      ? String(run?.error_summary || run?.error_detail || '').trim()
      : '';
  const failedMessageFirstLine = failedMessageRaw ? failedMessageRaw.split('\n')[0] : '';
  const failedMessage = failedMessageFirstLine ? humanizeErrorMessage(failedMessageFirstLine) : '';
  const canceledMessage = run?.status === 'CANCELED' ? 'El análisis fue cancelado.' : '';
  const qualityGateMessage = resolveQualityGateMessage(run?.status, {
    qualityGateFailed,
    qualityGateWarn,
  });
  const statusMessage = failedMessage || canceledMessage || qualityGateMessage;
  const shortDescription = statusMessage
    ? `Estado: ${run.status}. ${statusMessage}`
    : `Estado: ${run.status}. Quality gate: ${normalizeQualityGateLabel(qualityGate)}.`;

  const rawToolSummary = Array.isArray(run?.tool_summary) ? run.tool_summary : [];
  const toolOrder = ['semgrep', 'lizard', 'javalang', 'pmd', 'spotbugs'];
  const toolLabels = {
    semgrep: 'Semgrep',
    lizard: 'Lizard',
    javalang: 'javalang',
    pmd: 'PMD',
    spotbugs: 'SpotBugs',
  };
  const toolSummaryMap = new Map(
    rawToolSummary.map((item) => [String(item?.tool || '').toLowerCase(), item]),
  );

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
    healthCards: [
      { label: 'Quality Gate', value: normalizeQualityGateLabel(qualityGate) },
      { label: 'Cobertura', value: formatPercent(coverage) },
      { label: 'Duplicacion', value: formatPercent(duplicatedDensity) },
    ],
    summaryCards: [
      { label: 'Bugs', value: bugs },
      { label: 'Vulnerabilidades', value: vulnerabilities },
      { label: 'Code smells', value: codeSmells },
      { label: 'Complejidad', value: complexity },
      { label: 'NLOC', value: ncloc },
      { label: 'Calificacion de confiabilidad', value: reliabilityRating || 'N/A' },
      { label: 'Calificacion de seguridad', value: securityRating || 'N/A' },
      { label: 'Calificacion de mantenibilidad', value: maintainabilityRating || 'N/A' },
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
      bigOHint: String(item.big_o_hint || ''),
      bigOReason: String(item.big_o_reason || ''),
    })),
    toolSummary: toolOrder.map((tool) => {
      const item = toolSummaryMap.get(tool) || {};
      const bySeverity = item.by_severity || {};
      return {
        tool,
        displayName: toolLabels[tool] || tool,
        totalFindings: Number(item.total_findings || 0),
        affectedFilesCount: Number(item.affected_files_count || 0),
        bySeverity: {
          critical: Number(bySeverity.critical || 0),
          high: Number(bySeverity.high || 0),
          medium: Number(bySeverity.medium || 0),
          low: Number(bySeverity.low || 0),
        },
        topRules: Array.isArray(item.top_rules)
          ? item.top_rules.map((ruleItem) => ({
            rule: String(ruleItem?.rule || 'N/A'),
            count: Number(ruleItem?.count || 0),
          }))
          : [],
      };
    }),
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedRunId = searchParams.get('run');
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
  const runsRef = useRef(runs);
  runsRef.current = runs;

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
    () => runs.some((run) => IN_FLIGHT_RUN_STATUSES.has(String(run?.status || '').toUpperCase())),
    [runs],
  );

  const runsPollErrorsRef = useRef(0);
  const runsPollIntenseRef = useRef(null);

  useAnalysisRunsPoll({
    active: Boolean(projectId && hasInProgressRuns),
    source: 'DashboardPage',
    poll: useCallback(async () => {
      if (!projectId) return RUNS_POLL_SLOW_MS;
      try {
        const currentRuns = runsRef.current;
        const ids = collectInFlightRunIds(currentRuns);
        if (ids.length === 0) return RUNS_POLL_SLOW_MS;
        const bulkMap = await fetchAnalysisRunsStatusBulk(ids);
        const terminalDetected = [...bulkMap.values()].some((row) => {
          const s = String(row?.status || '').toUpperCase();
          return s === 'DONE' || s === 'FAILED' || s === 'CANCELED';
        });
        setRuns((prev) => {
          const next = mergeRunsFromStatusPoll(prev, bulkMap);
          if (next === prev) {
            analysisDashboardLog('runs_poll_no_change', {
              projectId: Number(projectId),
              idsCount: ids.length,
              ids,
            });
          } else {
            analysisDashboardLog('runs_poll_merged', {
              projectId: Number(projectId),
              idsCount: ids.length,
              bulkResolvedCount: bulkMap.size,
            });
          }
          return next;
        });
        if (terminalDetected) {
          const fullResponse = await listAnalysisRuns({ projectId, activeOnly: true });
          const fullRows = Array.isArray(fullResponse?.results) ? fullResponse.results : [];
          setRuns(fullRows);
          analysisDashboardLog('runs_poll_refetch_full_after_terminal', {
            projectId: Number(projectId),
            resolvedCount: fullRows.length,
          });
        }
        setRunsRefreshError('');
        runsPollErrorsRef.current = 0;
        const intense = hasInFlightStatus(bulkMap.values());
        const waitingWebhook = hasWaitingWebhookStatus(bulkMap.values());
        let nextIntervalMs = RUNS_POLL_SLOW_MS;
        if (intense) {
          nextIntervalMs = RUNS_POLL_FAST_MS;
        } else if (waitingWebhook) {
          nextIntervalMs = RUNS_POLL_WEBHOOK_MS;
        }
        
        const currentStrategy = runsPollIntenseRef.current;
        let newStrategy = 'slow';
        if (intense) {
          newStrategy = 'intense';
        } else if (waitingWebhook) {
          newStrategy = 'webhook';
        }
        
        if (currentStrategy !== newStrategy) {
          runsPollIntenseRef.current = newStrategy;
          analysisDashboardLog('runs_poll_strategy', {
            projectId: Number(projectId),
            strategy: newStrategy,
            nextIntervalMs,
            idsCount: ids.length,
          });
        }
        return nextIntervalMs;
      } catch (err) {
        runsPollErrorsRef.current += 1;
        const n = runsPollErrorsRef.current;
        const msg = extractErrorMessage(err, 'No se pudo refrescar el estado del análisis.');
        setRunsRefreshError(msg);
        return resolveRunsPollBackoff(n, err);
      }
    }, [projectId]),
  });

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
    const validationError = validateProjectName(normalized);
    if (validationError) {
      setNameError(validationError);
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
    if (projectFiles.length === 0) {
      setSelectedFileId(null);
      return;
    }
    if (requestedRunId) {
      const target = projectFiles.find((file) => file.id === `run-${requestedRunId}`);
      if (target) {
        setSelectedFileId(target.id);
        return;
      }
    }
    setSelectedFileId((current) => {
      if (current && projectFiles.some((file) => file.id === current)) {
        return current;
      }
      return projectFiles[0].id;
    });
  }, [projectFiles, requestedRunId]);

  function handleSelectFile(fileId) {
    setSelectedFileId(fileId);
    if (requestedRunId) {
      const next = new URLSearchParams(searchParams);
      next.delete('run');
      setSearchParams(next, { replace: true });
    }
  }

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
        onSelectFile={handleSelectFile}
        getStatusClass={analysisStatusClass}
        getStatusLabel={analysisStatusLabel}
      />

      <main className="dashboard-main">
        <section className="dashboard-header">
          {renderDashboardHeaderContent({
            isEditingName,
            repositoryName,
            startEditName,
            isAdmin,
            projectOwnerEmail,
            draftName,
            setDraftName,
            handleNameKeyDown,
            saveProjectName,
            savingName,
            cancelEditName,
            nameError,
            projectLoading,
            projectError,
            runsRefreshError,
            selectedAnalysis,
          })}
        </section>
        {renderDashboardAnalysisSections({
          selectedAnalysis,
          projectFiles,
          selectedFileId,
          handleSelectFile,
        })}
      </main>
    </div>
  );
}
