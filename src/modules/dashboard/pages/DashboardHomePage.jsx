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

function withUpdatedStatValue(stat, { projectCount, totalIssues, averageScore }) {
  if (stat.label === 'Proyectos') {
    return { ...stat, value: projectCount };
  }
  if (stat.label === 'Problemas detectados') {
    return { ...stat, value: totalIssues };
  }
  if (stat.label === 'Score promedio') {
    return { ...stat, value: averageScore };
  }
  return stat;
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const displayName = user?.nombre || user?.name || 'Usuario';

  const [projects, setProjects] = useState([]);
  const [projectCount, setProjectCount] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const stats = useMemo(
    () => staticStats.map((stat) => withUpdatedStatValue(stat, { projectCount, totalIssues, averageScore })),
    [projectCount, totalIssues, averageScore],
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
            filesCount: Number(project?.severity_summary?.total || 0),
            score: Number.isFinite(project?.quality_score) ? project.quality_score : 0,
            lastActivity: formatLastActivity(project.updated_at || project.created_at),
          })),
        );
        setProjectCount(response?.count ?? items.length);
        const issues = items.reduce(
          (acc, project) => acc + Number(project?.severity_summary?.total || 0),
          0,
        );
        const scores = items
          .map((project) => Number(project?.quality_score))
          .filter((score) => Number.isFinite(score));
        const avg = scores.length > 0
          ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length)
          : 0;
        setTotalIssues(issues);
        setAverageScore(avg);
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

        {projectsError && <p className="dash-welcome-sub">{projectsError}</p>}
        {loadingProjects ? (
          <p className="dash-welcome-sub">Cargando proyectos...</p>
        ) : (
          <div className="dash-recent-grid">
            {projects.map((project) => (
              <article className="dash-project-card" key={project.id}>
                <div className="dash-project-top">
                  <Link to={`/projects/${project.id}/dashboard`} className="dash-project-name">
                    {project.name}
                  </Link>
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
                  <Link
                    to={`/projects/${project.id}/dashboard`}
                    className="dash-action-btn dash-action-btn--open"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Abrir
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
