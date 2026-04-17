import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createAnalysisRun,
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from '../../projects/services/projectService';
import FileUpload from '../../../components/forms/FileUpload/FileUpload';
import ConfirmModal from '../../../components/ui/ConfirmModal/ConfirmModal';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import toast from '../../../utils/toast';
import './ProjectsPage.css';

function mapProjectToCard(project) {
  const createdDate = project.created_at
    ? new Date(project.created_at).toLocaleString('es-MX')
    : '';
  return {
    id: String(project.id),
    name: project.name,
    description: '',
    lastAnalysis: createdDate ? `Creado: ${createdDate}` : 'Sin analisis',
    createdAt: project.created_at ? new Date(project.created_at).toISOString().slice(0, 10) : '',
  };
}

function validate(value) {
  if (!value.trim()) return 'Este campo es obligatorio.';
  if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (value.trim().length > 100) return 'El nombre no puede exceder 100 caracteres.';
  return '';
}

export default function ProjectsPage() {
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
  const [uploading, setUploading] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const response = await getProjects();
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
  }, []);

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
        'Algo salio mal. Intentalo de nuevo.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  function inputClass() {
    if (!touched) return 'pj-input';
    return error ? 'pj-input pj-input--error' : 'pj-input pj-input--valid';
  }

  async function handleUploadSubmit(files) {
    if (!selectedProject?.id || !Array.isArray(files) || files.length === 0) return;

    setUploading(true);
    try {
      const projectId = Number(selectedProject.id);
      const results = await Promise.allSettled(
        files.map((file) => createAnalysisRun({ projectId, file })),
      );
      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.length - succeeded;

      if (succeeded === 0) {
        const firstError = results.find((result) => result.status === 'rejected');
        const data = firstError?.reason?.response?.data;
        const msg =
          data?.detail ||
          data?.message ||
          (Array.isArray(data?.source_file) ? data.source_file[0] : null) ||
          'No se pudieron enviar archivos a analisis.';
        toast.error(msg);
        return;
      }

      if (failed > 0) {
        toast.warning(`${succeeded} archivo(s) enviado(s), ${failed} con error.`);
      } else {
        toast.success(`${succeeded} archivo(s) enviado(s) a analisis.`);
      }
    } finally {
      setUploading(false);
    }
  }

  function handleCardClick(project, e) {
    // Ignore clicks on the inner "Abrir dashboard" link (it navigates away)
    if (e.target.closest('a')) return;
    openDetail(project);
  }

  function handleCardKey(project, e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('a')) return;
      e.preventDefault();
      openDetail(project);
    }
  }

  return (
    <div className="projects-page">
      <PageHeader
        eyebrow="Seleccion de proyecto"
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
          {loadingList ? (
            <p className="projects-analysis-time">Cargando proyectos...</p>
          ) : listError ? (
            <p className="projects-analysis-time">{listError}</p>
          ) : projects.length === 0 ? (
            <div className="projects-empty">
              <p>No tienes proyectos aun.</p>
              <button type="button" className="projects-create-btn" onClick={openCreate}>
                Crear tu primer proyecto
              </button>
            </div>
          ) : (
            projects.map((project) => {
              const isSelected = selectedId === project.id;
              const isEditing = editingId === project.id;
              return (
                <article
                  className={`projects-card${isSelected ? ' projects-card--selected' : ''}${isEditing ? ' projects-card--editing' : ''}`}
                  key={project.id}
                  onClick={(e) => {
                    if (isEditing) return;
                    handleCardClick(project, e);
                  }}
                  onKeyDown={(e) => {
                    if (isEditing) return;
                    handleCardKey(project, e);
                  }}
                  role={isEditing ? undefined : 'button'}
                  tabIndex={isEditing ? -1 : 0}
                  aria-pressed={!isEditing && isSelected}
                >
                  {isEditing ? (
                    <div
                      className="projects-card-edit"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
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
                  ) : (
                    <>
                      <h2>{project.name}</h2>
                      {project.description && <p>{project.description}</p>}
                      <p className="projects-analysis-time">{project.lastAnalysis}</p>
                    </>
                  )}
                  {!isEditing && (
                    <div className="projects-card-actions">
                      <Link className="projects-open-btn" to={`/projects/${project.id}/dashboard`}>
                        Abrir dashboard
                      </Link>
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
                        aria-label={`Eliminar "${project.name}"`}
                        title="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
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
                  <p className="pj-panel-subtitle">Crea un proyecto para analizar tu codigo Java</p>
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
                    <span className="pj-hint">Minimo 3 caracteres, maximo 100</span>
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
                <p className="pj-upload-sub">
                  Archivos .java individuales o un .zip con tu proyecto.
                </p>
                <FileUpload
                  projectName={selectedProject.name}
                  onSubmit={handleUploadSubmit}
                  disabled={uploading}
                  submitLabel={uploading ? 'Subiendo...' : 'Subir y analizar'}
                />
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
    </div>
  );
}
