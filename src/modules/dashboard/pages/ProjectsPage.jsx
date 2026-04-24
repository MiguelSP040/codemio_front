import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../../context/AuthContext';
import {
  createProject,
  deleteProject,
  getProjects,
  getProjectsByOwner,
  updateProject,
} from '../../projects/services/projectService';
import {
  createAnalysisRun,
  fetchRunsStateMapForTrackedIds,
  isRetriableAnalysisError,
} from '../../analysis/services/analysisService';
import { useAnalysisRunsPoll } from '../../../hooks/useAnalysisRunsPoll';
import humanizeErrorMessage from '../../../utils/errorMessages';
import { analysisProjectsLog } from '../../../utils/analysisInstrumentation';
import FileUpload from '../../../components/forms/FileUpload/FileUpload';
import ConfirmModal from '../../../components/ui/ConfirmModal/ConfirmModal';
import AnalysisProgressModal from '../components/AnalysisProgressModal';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import LoadingState from '../../../components/ui/LoadingState/LoadingState';
import toast from '../../../utils/toast';
import './ProjectsPage.css';

const PROGRESS_POLL_FAST_MS = 1000;
const PROGRESS_POLL_SLOW_MS = 4000;

function resolveItemStatusFromRun(run) {
  const rawStatus = String(run?.status || '').toUpperCase();
  const qg = String(run?.quality_gate_status || '').toUpperCase();
  if (rawStatus === 'DONE') {
    if (qg === 'FAILED' || qg === 'ERROR' || qg === 'WARN' || qg === 'WARNING') {
      return 'done_warn';
    }
    return 'done';
  }
  if (rawStatus === 'RUNNING' || rawStatus === 'WAITING_SONAR_WEBHOOK') return 'running';
  if (rawStatus === 'FAILED') return 'failed';
  if (rawStatus === 'CANCELED') return 'canceled';
  return 'queued';
}

const UPLOAD_ALLOWED_EXTENSIONS = ['.java', '.zip'];
const MAX_UPLOAD_SIZE_MB = 10;
const MAX_UPLOAD_TOTAL_MB = 30;

function mapProjectToCard(project) {
  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleString('es-MX')
    : '';
  const summary = project?.severity_summary || {};
  return {
    id: String(project.id),
    name: project.name,
    ownerEmail: project.user_email || '',
    description: '',
    lastAnalysis: createdDate ? `Creado: ${createdDate}` : 'Sin análisis',
    createdAt: project.created_at ? new Date(project.created_at).toISOString().slice(0, 10) : '',
    qualityScore: Number.isFinite(project?.quality_score) ? project.quality_score : null,
    severitySummary: {
      critical: Number(summary?.critical || 0),
      high: Number(summary?.high || 0),
      medium: Number(summary?.medium || 0),
      low: Number(summary?.low || 0),
      total: Number(summary?.total || 0),
    },
  };
}

function qualityTone(score) {
  if (score === null || score === undefined) return 'projects-quality--neutral';
  if (score >= 85) return 'projects-quality--good';
  if (score >= 70) return 'projects-quality--warning';
  return 'projects-quality--critical';
}

function validate(value) {
  if (!value.trim()) return 'Este campo es obligatorio.';
  if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (value.trim().length > 100) return 'El nombre no puede exceder 100 caracteres.';
  return '';
}

function getFileExtension(fileName) {
  const idx = String(fileName || '').lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

function validateUploadBatch(filesToUpload) {
  const errors = [];
  let totalBytes = 0;
  let zipCount = 0;
  let javaCount = 0;

  for (const file of filesToUpload) {
    const ext = getFileExtension(file?.name);
    totalBytes += Number(file?.size || 0);

    if (!UPLOAD_ALLOWED_EXTENSIONS.includes(ext)) {
      errors.push(`"${file.name}" no tiene una extension permitida.`);
      continue;
    }

    if (ext === '.zip') zipCount += 1;
    if (ext === '.java') javaCount += 1;

    if (!file.size || file.size <= 0) {
      errors.push(`"${file.name}" esta vacio.`);
      continue;
    }

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      errors.push(`"${file.name}" excede ${MAX_UPLOAD_SIZE_MB} MB.`);
    }
  }

  if (zipCount > 1) {
    errors.push('Solo puedes subir un archivo .zip a la vez.');
  }
  if (zipCount > 0 && javaCount > 0) {
    errors.push('No puedes mezclar archivos .java con un .zip en la misma carga.');
  }
  if (totalBytes > MAX_UPLOAD_TOTAL_MB * 1024 * 1024) {
    errors.push(`El total de archivos supera ${MAX_UPLOAD_TOTAL_MB} MB.`);
  }
  return errors;
}

function renderProjectsListContent({
  loadingList,
  listError,
  projects,
  openCreate,
  editingId,
  draftName,
  selectedId,
  handleCardClick,
  setDraftName,
  handleNameKeyDown,
  editingLoading,
  nameError,
  saveProjectName,
  cancelEditName,
  startEditName,
  qualityTone,
  requestDelete,
  isAdmin,
  currentUserEmail,
}) {
  if (loadingList) {
    return <LoadingState variant="skeleton" count={3} label="Cargando proyectos…" />;
  }
  if (listError) {
    return <p className="projects-analysis-time">{listError}</p>;
  }
  if (projects.length === 0) {
    return (
      <div className="projects-empty">
        <p>No tienes proyectos aun.</p>
        <button type="button" className="projects-create-btn" onClick={openCreate}>
          Crear tu primer proyecto
        </button>
      </div>
    );
  }
  return projects.map((project) => renderProjectCard({
    project,
    selectedId,
    editingId,
    draftName,
    setDraftName,
    handleNameKeyDown,
    editingLoading,
    nameError,
    saveProjectName,
    cancelEditName,
    startEditName,
    qualityTone,
    requestDelete,
    isAdmin,
    currentUserEmail,
    handleCardClick,
  }));
}

function ProjectCardEditingForm({
  project,
  draftName,
  setDraftName,
  handleNameKeyDown,
  editingLoading,
  nameError,
  saveProjectName,
  cancelEditName,
}) {
  return (
    <div className="projects-card-edit">
      <label htmlFor={`pj-edit-${project.id}`} className="pj-label">
        Nombre del proyecto
      </label>
      <input
        id={`pj-edit-${project.id}`}
        type="text"
        className="pj-input"
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onKeyDown={(e) => handleNameKeyDown(e, project.id)}
        maxLength={100}
        disabled={editingLoading}
        autoFocus
      />
      {nameError ? (
        <span className="pj-field-error" role="alert">{nameError}</span>
      ) : (
        <span className="pj-hint">Minimo 3 caracteres, maximo 100</span>
      )}
      <div className="projects-card-edit-actions">
        <button
          type="button"
          className="pj-btn pj-btn--primary"
          onClick={() => saveProjectName(project.id)}
          disabled={draftName.trim().length < 3 || editingLoading}
        >
          {editingLoading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          className="pj-btn pj-btn--ghost"
          onClick={cancelEditName}
          disabled={editingLoading}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

ProjectCardEditingForm.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
  draftName: PropTypes.string.isRequired,
  setDraftName: PropTypes.func.isRequired,
  handleNameKeyDown: PropTypes.func.isRequired,
  editingLoading: PropTypes.bool.isRequired,
  nameError: PropTypes.string.isRequired,
  saveProjectName: PropTypes.func.isRequired,
  cancelEditName: PropTypes.func.isRequired,
};

function renderProjectCard({
  project,
  selectedId,
  editingId,
  draftName,
  setDraftName,
  handleNameKeyDown,
  editingLoading,
  nameError,
  saveProjectName,
  cancelEditName,
  startEditName,
  qualityTone,
  requestDelete,
  isAdmin,
  currentUserEmail,
  handleCardClick,
}) {
  const isSelected = selectedId === project.id;
  const isEditing = editingId === project.id;
  const isReadOnlyForAdmin = isAdmin
    && Boolean(project.ownerEmail)
    && project.ownerEmail.toLowerCase() !== currentUserEmail.toLowerCase();
  return (
    <article
      className={`projects-card${isSelected ? ' projects-card--selected' : ''}${isEditing ? ' projects-card--editing' : ''}`}
      key={project.id}
    >
      {isEditing ? (
        <ProjectCardEditingForm
          project={project}
          draftName={draftName}
          setDraftName={setDraftName}
          handleNameKeyDown={handleNameKeyDown}
          editingLoading={editingLoading}
          nameError={nameError}
          saveProjectName={saveProjectName}
          cancelEditName={cancelEditName}
        />
      ) : (
        <>
          <div className="projects-card-heading">
            <h2>{project.name}</h2>
            <span className={`projects-quality ${qualityTone(project.qualityScore)}`}>
              {project.qualityScore === null ? 'Sin score' : `Score ${project.qualityScore}`}
            </span>
          </div>
          {project.description && <p>{project.description}</p>}
          {isAdmin && project.ownerEmail ? (
            <p className="projects-analysis-time">Propietario: {project.ownerEmail}</p>
          ) : null}
          {isReadOnlyForAdmin ? (
            <span className="projects-readonly-badge">Solo lectura</span>
          ) : null}
          <p className="projects-analysis-time">{project.lastAnalysis}</p>
          <div className="projects-severity-row" aria-label={`Resumen de severidad de ${project.name}`}>
            <span className="projects-severity-chip projects-severity-chip--critical">
              C {project.severitySummary.critical}
            </span>
            <span className="projects-severity-chip projects-severity-chip--high">
              A {project.severitySummary.high}
            </span>
            <span className="projects-severity-chip projects-severity-chip--medium">
              M {project.severitySummary.medium}
            </span>
            <span className="projects-severity-chip projects-severity-chip--low">
              B {project.severitySummary.low}
            </span>
            <span className="projects-severity-total">
              Total {project.severitySummary.total}
            </span>
          </div>
        </>
      )}
      {!isEditing && (
        <div className="projects-card-actions">
          <button
            type="button"
            className="projects-card-btn"
            onClick={() => handleCardClick(project)}
          >
            Ver detalle
          </button>
          <Link className="projects-open-btn" to={`/projects/${project.id}/dashboard`}>
            Abrir dashboard
          </Link>
          {isReadOnlyForAdmin ? null : (
            <>
              <button
                type="button"
                className="projects-card-btn projects-card-btn--edit"
                onClick={(e) => { e.stopPropagation(); startEditName(project); }}
                aria-label={`Editar nombre de ${project.name}`}
                title="Editar nombre"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
              <button
                type="button"
                className="projects-card-btn projects-card-btn--delete"
                onClick={(e) => { e.stopPropagation(); requestDelete(project); }}
                aria-label={`Eliminar proyecto ${project.name}`}
                title="Eliminar proyecto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Eliminar
              </button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function mergeRunIntoItem(item, runsById) {
  if (!item.runId) return item;
  const run = runsById.get(item.runId);
  if (!run) return item;
  const nextStatus = resolveItemStatusFromRun(run);
  const rawError = nextStatus === 'failed'
    ? String(run?.error_summary || run?.error_detail || '').split('\n')[0]
    : '';
  const nextError = rawError ? humanizeErrorMessage(rawError) : '';
  return { ...item, status: nextStatus, error: nextError || item.error };
}

function hasIntenseRunStatusInMap(runsById) {
  for (const run of runsById.values()) {
    const s = String(run?.status || '').toUpperCase();
    if (s === 'PENDING' || s === 'RUNNING' || s === 'WAITING_SONAR_WEBHOOK') return true;
  }
  return false;
}

function resolveProjectsPollInterval(intense) {
  if (intense) return PROGRESS_POLL_FAST_MS;
  return PROGRESS_POLL_SLOW_MS;
}

function resolveProjectsPollBackoff(attempt, err) {
  if (isRetriableAnalysisError(err)) {
    return Math.min(60000, PROGRESS_POLL_SLOW_MS * 2 ** Math.min(attempt, 5));
  }
  return Math.min(30000, PROGRESS_POLL_SLOW_MS * 2 ** Math.min(attempt, 4));
}

async function hasValidZipSignature(file) {
  try {
    const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return header[0] === 0x50 && header[1] === 0x4b;
  } catch {
    return false;
  }
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = (user?.rol || user?.role) === 'admin';
  const currentUserEmail = String(user?.correo || user?.email || '').toLowerCase();
  const [projects, setProjects] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  /* Panel state: 'default' | 'create' | 'detail' */
  const [mode, setMode] = useState('default');
  const [selectedId, setSelectedId] = useState(null);

  /* Create-form state */
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  /* Inline edit state (per-card) */
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState('');
  const [editingLoading, setEditingLoading] = useState(false);

  /* Delete state */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadingAnalysis, setUploadingAnalysis] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressItems, setProgressItems] = useState([]);
  const [progressProjectId, setProgressProjectId] = useState(null);
  const progressPollBundleRef = useRef(null);
  const progressPollErrorsRef = useRef(0);
  const progressPollIntenseRef = useRef(null);
  const navigate = useNavigate();

  const progressPollBundle = useMemo(() => {
    if (!progressOpen || !progressProjectId) return null;
    const trackedRunIds = progressItems
      .map((item) => item.runId)
      .filter((id) => id != null);
    const anyPending = progressItems.some(
      (item) =>
        item.status === 'uploading' ||
        item.status === 'queued' ||
        item.status === 'running',
    );
    if (trackedRunIds.length === 0 || !anyPending) return null;
    const key = `${progressProjectId}:${[...new Set(trackedRunIds)]
      .sort((a, b) =>
        String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' }))
      .join(',')}`;
    return { projectId: progressProjectId, trackedRunIds, key };
  }, [progressOpen, progressProjectId, progressItems]);

  progressPollBundleRef.current = progressPollBundle;

  useAnalysisRunsPoll({
    active: Boolean(progressPollBundle),
    source: 'ProjectsPage',
    poll: async () => {
      const bundle = progressPollBundleRef.current;
      if (!bundle?.trackedRunIds?.length) return PROGRESS_POLL_SLOW_MS;
      try {
        const runsById = await fetchRunsStateMapForTrackedIds(
          bundle.projectId,
          bundle.trackedRunIds,
        );
        setProgressItems((current) => {
          const next = current.map((item) => mergeRunIntoItem(item, runsById));
          const sig = (it) => `${it.runId}|${it.status}|${it.error || ''}`;
          const changed =
            next.length !== current.length ||
            next.some((it, i) => sig(it) !== sig(current[i]));
          if (changed) {
            analysisProjectsLog('tracked_runs_updated', {
              projectId: bundle.projectId,
              idsCount: bundle.trackedRunIds.length,
              trackedRunIds: bundle.trackedRunIds,
            });
          } else {
            analysisProjectsLog('tracked_runs_no_change', {
              projectId: bundle.projectId,
              idsCount: bundle.trackedRunIds.length,
            });
          }
          return next;
        });
        progressPollErrorsRef.current = 0;
        const intense = hasIntenseRunStatusInMap(runsById);
        const nextIntervalMs = resolveProjectsPollInterval(intense);
        if (progressPollIntenseRef.current !== intense) {
          progressPollIntenseRef.current = intense;
          analysisProjectsLog('runs_poll_strategy', {
            projectId: bundle.projectId,
            intense,
            nextIntervalMs,
            idsCount: bundle.trackedRunIds.length,
          });
        }
        return nextIntervalMs;
      } catch (err) {
        progressPollErrorsRef.current += 1;
        const n = progressPollErrorsRef.current;
        return resolveProjectsPollBackoff(n, err);
      }
    },
  });

  const selectedProject = projects.find((p) => p.id === selectedId) || null;
  const selectedProjectReadOnly = Boolean(
    isAdmin
      && selectedProject?.ownerEmail
      && selectedProject.ownerEmail.toLowerCase() !== currentUserEmail,
  );

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const response = isAdmin ? await getProjectsByOwner({}) : await getProjects();
        if (!isMounted) return;
        const items = Array.isArray(response?.results) ? response.results : [];
        setProjects(items.map(mapProjectToCard));
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const msg =
          data?.detail ||
          data?.message ||
          'No se pudieron cargar tus proyectos.';
        setListError(msg);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  function resetForm() {
    setName('');
    setTouched(false);
    setError('');
    setServerError('');
  }

  function resetEditName() {
    setEditingId(null);
    setDraftName('');
    setNameError('');
  }

  function openCreate() {
    resetForm();
    resetEditName();
    setSelectedId(null);
    setMode('create');
  }

  function openDetail(project) {
    setSelectedId(project.id);
    setMode('detail');
  }

  function closePanel() {
    resetForm();
    setSelectedId(null);
    setMode('default');
  }

  function startEditName(project) {
    setEditingId(project.id);
    setDraftName(project.name);
    setNameError('');
  }

  function cancelEditName() {
    resetEditName();
  }

  async function saveProjectName(projectId) {
    const normalized = draftName.trim();
    if (normalized.length < 3) {
      setNameError('El nombre debe tener al menos 3 caracteres.');
      return;
    }
    if (normalized.length > 100) {
      setNameError('El nombre no puede exceder 100 caracteres.');
      return;
    }
    setEditingLoading(true);
    try {
      const updated = await updateProject(projectId, { name: normalized });
      setProjects((prev) =>
        prev.map((p) => (p.id === String(updated.id) ? { ...p, name: updated.name } : p)),
      );
      resetEditName();
      toast.success('Nombre del proyecto actualizado');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (Array.isArray(data?.name) ? data.name[0] : null) ||
        'No se pudo actualizar el proyecto.';
      setNameError(msg);
    } finally {
      setEditingLoading(false);
    }
  }

  function handleNameKeyDown(e, projectId) {
    if (e.key === 'Enter') { e.preventDefault(); saveProjectName(projectId); }
    if (e.key === 'Escape') { e.preventDefault(); cancelEditName(); }
  }

  function requestDelete(project) {
    setDeleteTarget(project);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const deletedId = deleteTarget.id;
    setDeleteLoading(true);
    try {
      await deleteProject(deletedId);
      setProjects((prev) => prev.filter((p) => p.id !== deletedId));
      setDeleteTarget(null);
      if (editingId === deletedId) resetEditName();
      if (selectedId === deletedId) {
        setSelectedId(null);
        setMode('default');
      }
      toast.success('Proyecto eliminado');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.message || 'No se pudo eliminar el proyecto';
      toast.error(msg);
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  function handleChange(e) {
    setName(e.target.value);
    setServerError('');
    if (touched) setError(validate(e.target.value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(name));
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    const err = validate(name);
    setError(err);
    setTouched(true);
    if (err) return;

    setLoading(true);
    setServerError('');

    try {
      const project = await createProject({ name: name.trim() });
      const newProject = mapProjectToCard(project);
      setProjects((prev) => [newProject, ...prev]);
      resetForm();
      // Transition straight into detail mode so the user can upload right away
      setSelectedId(newProject.id);
      setMode('detail');
      toast.success('Proyecto creado');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        (Array.isArray(data?.name) ? data.name[0] : null) ||
        'No pudimos crear el proyecto. Verifica el nombre e inténtalo de nuevo.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  function inputClass() {
    if (!touched) return 'pj-input';
    return error ? 'pj-input pj-input--error' : 'pj-input pj-input--valid';
  }

  function handleCardClick(project) {
    openDetail(project);
  }

  async function handleUploadFiles(filesToUpload) {
    if (!selectedProject || !Array.isArray(filesToUpload) || filesToUpload.length === 0) return;
    const uploadErrors = validateUploadBatch(filesToUpload);
    for (const file of filesToUpload) {
      if (getFileExtension(file?.name) !== '.zip') continue;
      const isZipValid = await hasValidZipSignature(file);
      if (!isZipValid) uploadErrors.push(`"${file.name}" no tiene una firma ZIP valida.`);
    }
    if (uploadErrors.length > 0) {
      toast.error(uploadErrors[0]);
      return;
    }
    setUploadingAnalysis(true);
    const initialItems = filesToUpload.map((file, index) => ({
      tempId: `upload-${Date.now()}-${index}`,
      fileName: file?.name || `Archivo ${index + 1}`,
      runId: null,
      status: 'uploading',
      error: '',
    }));
    setProgressItems(initialItems);
    setProgressProjectId(selectedProject.id);
    setProgressOpen(true);

    let overwriteCount = 0;
    for (let i = 0; i < filesToUpload.length; i += 1) {
      const sourceFile = filesToUpload[i];
      const tempId = initialItems[i].tempId;
      try {
        const run = await createAnalysisRun({
          projectId: selectedProject.id,
          sourceFile,
        });
        if (run?.overwrite_applied) overwriteCount += 1;
        const runId = run?.id ?? null;
        const initialStatus = resolveItemStatusFromRun(run);
        setProgressItems((current) =>
          current.map((item) =>
            item.tempId === tempId
              ? { ...item, runId, status: initialStatus, error: '' }
              : item,
          ),
        );
      } catch (err) {
        const data = err.response?.data;
        const rawMsg = data?.detail || data?.message || 'No se pudo iniciar el analisis.';
        const msg = humanizeErrorMessage(rawMsg);
        setProgressItems((current) =>
          current.map((item) =>
            item.tempId === tempId
              ? { ...item, status: 'failed', error: msg }
              : item,
          ),
        );
      }
    }

    if (overwriteCount > 0) {
      toast.info(
        overwriteCount === 1
          ? 'Se sobrescribio la version activa de 1 archivo con el mismo nombre.'
          : `Se sobrescribieron ${overwriteCount} archivos activos con el mismo nombre.`,
      );
    }
    setUploadingAnalysis(false);
  }

  function handleCloseProgress() {
    setProgressOpen(false);
    setProgressItems([]);
    setProgressProjectId(null);
  }

  function handleGoToDashboard() {
    const targetId = progressProjectId;
    handleCloseProgress();
    if (targetId) navigate(`/projects/${targetId}/dashboard`);
  }

  return (
    <div className="projects-page">
      <PageHeader
        eyebrow="Selección de proyecto"
        title="Proyectos disponibles"
        description="Selecciona un proyecto para abrir su dashboard y revisar archivos analizados."
        action={
          <button type="button" className="projects-create-btn" onClick={openCreate}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo proyecto
          </button>
        }
      />

      <div className="projects-split projects-split--open">
        {/* Left: project list */}
        <section className="projects-list" aria-label="Lista de proyectos">
          {renderProjectsListContent({
            loadingList,
            listError,
            projects,
            openCreate,
            editingId,
            draftName,
            selectedId,
            handleCardClick,
            setDraftName,
            handleNameKeyDown,
            editingLoading,
            nameError,
            saveProjectName,
            cancelEditName,
            startEditName,
            qualityTone,
            requestDelete,
            isAdmin,
            currentUserEmail,
          })}
        </section>

        {/* Right: contextual panel (always visible) */}
        <aside className="projects-panel" aria-label="Panel de contexto">
          {mode === 'default' && (
            <div className="pj-mode pj-default" key="default">
              <div className="pj-default-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h2 className="pj-default-title">Selecciona un proyecto</h2>
              <p className="pj-default-sub">
                Elige un proyecto de la lista para ver su detalle y subir archivos,
                o crea uno nuevo.
              </p>
              <button type="button" className="pj-btn pj-btn--primary" onClick={openCreate}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nuevo proyecto
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="pj-mode" key="create">
              <div className="pj-panel-header">
                <div className="pj-panel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </div>
                <div>
                  <h2 className="pj-panel-title">Nuevo proyecto</h2>
                  <p className="pj-panel-subtitle">Crea un proyecto para analizar tu código Java</p>
                </div>
                <button type="button" className="pj-panel-close" onClick={closePanel} aria-label="Cerrar panel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form className="pj-form" onSubmit={handleCreateSubmit} noValidate>
                {serverError && (
                  <div className="pj-server-error" role="alert">{serverError}</div>
                )}

                <div className="pj-field">
                  <label htmlFor="pj-name" className="pj-label">Nombre del proyecto</label>
                  <input
                    id="pj-name"
                    type="text"
                    placeholder="Ej: Mi proyecto Java"
                    className={inputClass()}
                    value={name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    maxLength={100}
                    autoFocus
                  />
                  {touched && error ? (
                    <span className="pj-field-error" role="alert">{error}</span>
                  ) : (
                    <span className="pj-hint">Mínimo 3 caracteres, máximo 100</span>
                  )}
                </div>

                <button type="submit" className="pj-btn pj-btn--primary pj-btn--full" disabled={loading}>
                  {loading ? (
                    <span className="pj-spinner" />
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Crear proyecto
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {mode === 'detail' && selectedProject && (
            <div className="pj-mode" key={`detail-${selectedProject.id}`}>
              <div className="pj-panel-header">
                <div className="pj-panel-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="pj-panel-heading-text">
                  <h2 className="pj-panel-title" title={selectedProject.name}>
                    {selectedProject.name}
                  </h2>
                  <p className="pj-panel-subtitle">
                    {selectedProject.createdAt
                      ? `Creado el ${selectedProject.createdAt}`
                      : selectedProject.lastAnalysis}
                  </p>
                </div>
                <button type="button" className="pj-panel-close" onClick={closePanel} aria-label="Cerrar panel">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {selectedProject.description && (
                <p className="pj-detail-description">{selectedProject.description}</p>
              )}

              <section className="pj-metrics" aria-label="Metricas del proyecto">
                <header className="pj-metrics-header">
                  <h3>Resumen de calidad</h3>
                  <span className={`projects-quality ${qualityTone(selectedProject.qualityScore)}`}>
                    {selectedProject.qualityScore === null
                      ? 'Sin score'
                      : `Score ${selectedProject.qualityScore}`}
                  </span>
                </header>
                <div className="pj-metrics-grid">
                  <article className="pj-metric-card">
                    <p>Criticos</p>
                    <strong>{selectedProject.severitySummary.critical}</strong>
                  </article>
                  <article className="pj-metric-card">
                    <p>Altos</p>
                    <strong>{selectedProject.severitySummary.high}</strong>
                  </article>
                  <article className="pj-metric-card">
                    <p>Medios</p>
                    <strong>{selectedProject.severitySummary.medium}</strong>
                  </article>
                  <article className="pj-metric-card">
                    <p>Bajos</p>
                    <strong>{selectedProject.severitySummary.low}</strong>
                  </article>
                </div>
              </section>

              <div className="pj-detail-actions">
                <Link
                  to={`/projects/${selectedProject.id}/dashboard`}
                  className="pj-btn pj-btn--ghost pj-btn--full"
                >
                  Abrir dashboard
                </Link>
              </div>

              <div className="pj-upload-section">
                <h3 className="pj-upload-title">Subir archivos para analizar</h3>
                {selectedProjectReadOnly ? (
                  <p className="pj-upload-sub">
                    Este proyecto es de solo lectura para administradores.
                  </p>
                ) : (
                  <>
                    <p className="pj-upload-sub">
                      Archivos .java individuales o un .zip con tu proyecto.
                    </p>
                    <FileUpload
                      projectName={selectedProject.name}
                      disabled={uploadingAnalysis}
                      acceptedExtensions={UPLOAD_ALLOWED_EXTENSIONS}
                      maxFileSizeMB={MAX_UPLOAD_SIZE_MB}
                      maxZipSizeMB={MAX_UPLOAD_SIZE_MB}
                      maxTotalSizeMB={MAX_UPLOAD_TOTAL_MB}
                      submitLabel={uploadingAnalysis ? 'Enviando...' : 'Subir archivos'}
                      onSubmit={handleUploadFiles}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        variant="danger"
        title="¿Eliminar proyecto?"
        message={
          deleteTarget ? (
            <>
              Estas seguro de que quieres eliminar{' '}
              <strong>{deleteTarget.name}</strong>? Esta accion no se puede deshacer.
            </>
          ) : ''
        }
        confirmText={deleteLoading ? 'Eliminando...' : 'Si, eliminar'}
        cancelText="Cancelar"
        busy={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AnalysisProgressModal
        open={progressOpen}
        items={progressItems}
        onClose={handleCloseProgress}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
}
