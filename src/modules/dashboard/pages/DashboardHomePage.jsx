import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getProjects } from '../../projects/services/projectService';
import './DashboardHomePage.css';

const staticStats = [
  {
    label: 'Proyectos',
    value: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: 'var(--primary-dark-blue)',
    bg: 'rgba(30, 58, 95, 0.08)',
  },
  {
    label: 'Archivos analizados',
    value: 14,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    color: 'var(--secondary-medium-blue)',
    bg: 'rgba(70, 130, 180, 0.08)',
  },
  {
    label: 'Problemas detectados',
    value: 6,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    color: 'var(--accent-warm-orange)',
    bg: 'rgba(217, 160, 111, 0.1)',
  },
  {
    label: 'Score promedio',
    value: 82,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: 'var(--secondary-dark-green)',
    bg: 'rgba(46, 139, 87, 0.08)',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function scoreClass(score) {
  if (score >= 80) return 'dash-score--good';
  if (score >= 60) return 'dash-score--warning';
  return 'dash-score--critical';
}

function formatLastActivity(value) {
  if (!value) return 'Sin actividad reciente';
  return new Date(value).toLocaleString('es-MX');
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const displayName = user?.nombre || user?.name || 'Usuario';

  const [projects, setProjects] = useState([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);

  const stats = useMemo(
    () =>
      staticStats.map((stat) =>
        stat.label === 'Proyectos'
          ? { ...stat, value: projectCount }
          : stat,
      ),
    [projectCount],
  );

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const response = await getProjects();
        if (!isMounted) return;
        const items = Array.isArray(response?.results) ? response.results : [];
        setProjects(
          items.map((project) => ({
            id: String(project.id),
            name: project.name,
            filesCount: 0,
            score: 0,
            lastActivity: formatLastActivity(project.updated_at || project.created_at),
          })),
        );
        setProjectCount(response?.count ?? items.length);
      } catch (err) {
        if (!isMounted) return;
        const data = err.response?.data;
        const msg = data?.detail || data?.message || 'No se pudieron cargar los proyectos.';
        setProjectsError(msg);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    }
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  function startEdit(project) {
    setEditingId(project.id);
    setEditName(project.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  function saveEdit(projectId) {
    const trimmed = editName.trim();
    if (trimmed.length < 3) return;
    /* --- Real: PATCH /projects/:id --- */
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: trimmed } : p)),
    );
    setEditingId(null);
    setEditName('');
  }

  function handleEditKeyDown(e, projectId) {
    if (e.key === 'Enter') saveEdit(projectId);
    if (e.key === 'Escape') cancelEdit();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    /* --- Real: DELETE /projects/:id --- */
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="dash-home">
      {/* Welcome */}
      <section className="dash-welcome">
        <div>
          <h1 className="dash-welcome-title">
            {getGreeting()}, {displayName}
          </h1>
          <p className="dash-welcome-sub">
            Aqui tienes un resumen de tus proyectos y analisis recientes.
          </p>
        </div>
        <Link to="/projects" className="dash-welcome-cta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo proyecto
        </Link>
      </section>

      {/* Stats */}
      <section className="dash-stats" aria-label="Estadisticas generales">
        {stats.map((stat) => (
          <article className="dash-stat-card" key={stat.label}>
            <div className="dash-stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value" style={{ color: stat.color }}>{stat.value}</span>
              <span className="dash-stat-label">{stat.label}</span>
            </div>
          </article>
        ))}
      </section>

      {/* Recent Projects */}
      <section className="dash-recent">
        <header className="dash-section-header">
          <h2>Proyectos recientes</h2>
          <Link to="/projects" className="dash-section-link">
            Ver todos
          </Link>
        </header>

        {projectsError && (
          <p className="dash-welcome-sub">{projectsError}</p>
        )}
        {loadingProjects ? (
          <p className="dash-welcome-sub">Cargando proyectos...</p>
        ) : (
          <div className="dash-recent-grid">
          {projects.map((project) => (
            <article className="dash-project-card" key={project.id}>
              <div className="dash-project-top">
                {editingId === project.id ? (
                  <div className="dash-edit-inline">
                    <input
                      className="dash-edit-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, project.id)}
                      autoFocus
                    />
                    <div className="dash-edit-actions">
                      <button
                        type="button"
                        className="dash-edit-save"
                        onClick={() => saveEdit(project.id)}
                        disabled={editName.trim().length < 3}
                      >
                        Guardar
                      </button>
                      <button type="button" className="dash-edit-cancel" onClick={cancelEdit}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/projects/${project.id}/dashboard`} className="dash-project-name">
                    {project.name}
                  </Link>
                )}
                <span className={`dash-project-score ${scoreClass(project.score)}`}>
                  {project.score}
                </span>
              </div>
              <div className="dash-project-meta">
                <span>{project.filesCount} archivos</span>
                <span className="dash-project-dot" aria-hidden="true" />
                <span>{project.lastActivity}</span>
              </div>
              <div className="dash-project-actions">
                <Link to={`/projects/${project.id}/dashboard`} className="dash-action-btn dash-action-btn--open">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Abrir
                </Link>
                <button
                  type="button"
                  className="dash-action-btn dash-action-btn--edit"
                  aria-label="Editar proyecto"
                  onClick={() => startEdit(project)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </button>
                <button
                  type="button"
                  className="dash-action-btn dash-action-btn--delete"
                  aria-label="Eliminar proyecto"
                  onClick={() => setDeleteTarget(project)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
          </div>
        )}
      </section>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="dash-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dash-modal-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="dash-modal-title">Eliminar proyecto</h3>
            <p className="dash-modal-text">
              Estas seguro de que quieres eliminar{' '}
              <strong>{deleteTarget.name}</strong>? Esta accion no se puede deshacer.
            </p>
            <div className="dash-modal-actions">
              <button
                type="button"
                className="dash-modal-btn dash-modal-btn--cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="dash-modal-btn dash-modal-btn--delete"
                onClick={confirmDelete}
              >
                Si, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
