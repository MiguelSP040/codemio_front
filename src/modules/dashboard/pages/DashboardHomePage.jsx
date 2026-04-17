import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getProjects } from '../../projects/services/projectService';
import { listAnalysisRuns } from '../../analysis/services/analysisService';
import LoadingState from '../../../components/ui/LoadingState/LoadingState';
import './DashboardHomePage.css';

const RUN_STATUS_LABELS = {
  PENDING: 'En cola',
  RUNNING: 'En proceso',
  DONE: 'Completado',
  FAILED: 'Fallido',
  CANCELED: 'Cancelado',
};

const RUN_STATUS_COLORS = {
  PENDING: '#6b7280',
  RUNNING: '#2563eb',
  DONE: '#15803d',
  FAILED: '#b91c1c',
  CANCELED: '#92400e',
};

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
    value: 0,
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
  {
    label: 'Metodos sintacticos',
    value: 0,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16" />
        <path d="M4 12h10" />
        <path d="M4 17h7" />
      </svg>
    ),
    color: 'var(--color-secondary)',
    bg: 'rgba(70, 130, 180, 0.12)',
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

function formatDateInput(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  const day = String(dateValue.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultDateRange() {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 30);
  return {
    from: formatDateInput(fromDate),
    to: formatDateInput(toDate),
  };
}

function toRangeDate(dateInput, fallbackHour) {
  if (!dateInput) return null;
  const normalized = new Date(`${dateInput}T${fallbackHour}`);
  if (Number.isNaN(normalized.getTime())) return null;
  return normalized;
}

function normalizeRunStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (RUN_STATUS_LABELS[normalized]) return normalized;
  return 'PENDING';
}

function buildDonutSegments(statusCounts) {
  const entries = Object.entries(RUN_STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    value: Number(statusCounts?.[status] || 0),
    color: RUN_STATUS_COLORS[status],
  }));
  const total = entries.reduce((acc, entry) => acc + entry.value, 0);
  if (total <= 0) {
    return {
      total: 0,
      entries,
      circles: [],
    };
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;
  const circles = entries
    .filter((entry) => entry.value > 0)
    .map((entry) => {
      const ratio = entry.value / total;
      const dashLength = circumference * ratio;
      const circle = {
        status: entry.status,
        color: entry.color,
        dashArray: `${dashLength} ${circumference - dashLength}`,
        dashOffset: -cumulativeOffset,
      };
      cumulativeOffset += dashLength;
      return circle;
    });

  return {
    total,
    entries,
    circles,
  };
}

function buildRunsTimeline(runs, fromInput, toInput) {
  const fromDate = toRangeDate(fromInput, '00:00:00');
  const toDate = toRangeDate(toInput, '23:59:59');
  if (!fromDate || !toDate || fromDate > toDate) {
    return [];
  }
  const buckets = new Map();
  let cursor = new Date(fromDate);
  while (cursor.getTime() <= toDate.getTime()) {
    const key = formatDateInput(cursor);
    buckets.set(key, 0);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
  }

  runs.forEach((run) => {
    const referenceDate = run?.finished_at || run?.started_at || run?.created_at;
    if (!referenceDate) return;
    const runDate = new Date(referenceDate);
    if (Number.isNaN(runDate.getTime())) return;
    const key = formatDateInput(runDate);
    if (buckets.has(key)) {
      buckets.set(key, Number(buckets.get(key) || 0) + 1);
    }
  });

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

function buildLineChartPoints(timeline, width, height, padding) {
  if (!timeline.length) return '';
  const maxValue = Math.max(...timeline.map((item) => item.count), 1);
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);
  if (timeline.length === 1) {
    const y = padding + chartHeight - ((timeline[0].count / maxValue) * chartHeight);
    return `${padding},${y} ${width - padding},${y}`;
  }
  return timeline
    .map((item, index) => {
      const x = padding + ((index / (timeline.length - 1)) * chartWidth);
      const y = padding + chartHeight - ((item.count / maxValue) * chartHeight);
      return `${x},${y}`;
    })
    .join(' ');
}

function buildSeverityDistribution(projects) {
  return projects.reduce(
    (acc, project) => {
      acc.critical += Number(project?.severity?.critical || 0);
      acc.high += Number(project?.severity?.high || 0);
      acc.medium += Number(project?.severity?.medium || 0);
      acc.low += Number(project?.severity?.low || 0);
      return acc;
    },
    {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    },
  );
}

function withUpdatedStatValue(stat, {
  projectCount,
  totalIssues,
  averageScore,
  totalSyntacticMethods,
  totalFilesAnalyzed,
}) {
  if (stat.label === 'Proyectos') {
    return { ...stat, value: projectCount };
  }
  if (stat.label === 'Archivos analizados') {
    return { ...stat, value: totalFilesAnalyzed };
  }
  if (stat.label === 'Problemas detectados') {
    return { ...stat, value: totalIssues };
  }
  if (stat.label === 'Score promedio') {
    return { ...stat, value: averageScore };
  }
  if (stat.label === 'Metodos sintacticos') {
    return { ...stat, value: totalSyntacticMethods };
  }
  return stat;
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const displayName = user?.nombre || user?.name || 'Usuario';
  const [dateRange, setDateRange] = useState(() => createDefaultDateRange());
  const [dateFilter, setDateFilter] = useState(() => createDefaultDateRange());

  const [projects, setProjects] = useState([]);
  const [projectsForCharts, setProjectsForCharts] = useState([]);
  const [projectCount, setProjectCount] = useState(0);
  const [totalIssues, setTotalIssues] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [totalSyntacticMethods, setTotalSyntacticMethods] = useState(0);
  const [totalFilesAnalyzed, setTotalFilesAnalyzed] = useState(0);
  const [runsInRange, setRunsInRange] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    PENDING: 0,
    RUNNING: 0,
    DONE: 0,
    FAILED: 0,
    CANCELED: 0,
  });
  const [runsLoading, setRunsLoading] = useState(true);
  const [runsError, setRunsError] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const stats = useMemo(
    () => staticStats.map((stat) => withUpdatedStatValue(stat, {
      projectCount,
      totalIssues,
      averageScore,
      totalSyntacticMethods,
      totalFilesAnalyzed,
    })),
    [projectCount, totalIssues, averageScore, totalSyntacticMethods, totalFilesAnalyzed],
  );

  useEffect(() => {
    let isMounted = true;
    async function loadProjects() {
      try {
        const response = await getProjects();
        if (!isMounted) return;
        const items = Array.isArray(response?.results) ? response.results : [];
        const mappedProjects = items
          .map((project) => ({
            id: String(project.id),
            name: project.name,
            filesCount: Number(project?.severity_summary?.total || 0),
            score: Number.isFinite(project?.quality_score) ? project.quality_score : 0,
            lastActivity: formatLastActivity(project.updated_at || project.created_at),
            lastActivityRaw: project.updated_at || project.created_at || '',
          }))
          .sort((left, right) => {
            const leftTime = new Date(left.lastActivityRaw).getTime();
            const rightTime = new Date(right.lastActivityRaw).getTime();
            return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
          })
          .slice(0, 3);
        setProjects(mappedProjects);
        setProjectsForCharts(
          items.map((project) => ({
            id: String(project.id),
            name: project.name,
            score: Number.isFinite(project?.quality_score) ? project.quality_score : 0,
            severity: {
              critical: Number(project?.severity_summary?.critical || 0),
              high: Number(project?.severity_summary?.high || 0),
              medium: Number(project?.severity_summary?.medium || 0),
              low: Number(project?.severity_summary?.low || 0),
            },
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
        setTotalSyntacticMethods(
          items.reduce((acc, project) => (
            acc + Number(project?.syntax_summary?.methods || 0)
          ), 0),
        );
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

  useEffect(() => {
    let isMounted = true;
    async function loadRunsMetrics() {
      setRunsLoading(true);
      setRunsError('');
      try {
        let nextPage = 1;
        let hasMore = true;
        const nextStatusCounts = {
          PENDING: 0,
          RUNNING: 0,
          DONE: 0,
          FAILED: 0,
          CANCELED: 0,
        };
        const filteredRuns = [];
        let filesAnalyzedTotal = 0;
        const fromDate = toRangeDate(dateRange.from, '00:00:00');
        const toDate = toRangeDate(dateRange.to, '23:59:59');
        while (hasMore && nextPage <= 20) {
          const response = await listAnalysisRuns({ page: nextPage });
          const items = Array.isArray(response?.results) ? response.results : [];
          items.forEach((run) => {
            if (normalizeRunStatus(run?.status) === 'DONE' && run?.is_active_for_filename) {
              filesAnalyzedTotal += Number(run?.total_files_analyzed || 0);
            }
          });
          const rangeItems = items.filter((run) => {
            const referenceDate = run?.finished_at || run?.started_at || run?.created_at;
            if (!referenceDate) return false;
            const runDate = new Date(referenceDate);
            if (Number.isNaN(runDate.getTime())) return false;
            if (fromDate && runDate < fromDate) return false;
            if (toDate && runDate > toDate) return false;
            return true;
          });
          rangeItems.forEach((run) => {
            const normalizedStatus = normalizeRunStatus(run?.status);
            nextStatusCounts[normalizedStatus] += 1;
          });
          filteredRuns.push(...rangeItems);
          hasMore = Boolean(response?.next);
          nextPage += 1;
        }
        if (isMounted) {
          setStatusCounts(nextStatusCounts);
          setRunsInRange(filteredRuns);
          setTotalFilesAnalyzed(filesAnalyzedTotal);
        }
      } catch (err) {
        if (isMounted) {
          const data = err.response?.data;
          const message = data?.detail || data?.message || 'No se pudieron cargar las metricas de analisis.';
          setRunsError(message);
          setRunsInRange([]);
          setStatusCounts({
            PENDING: 0,
            RUNNING: 0,
            DONE: 0,
            FAILED: 0,
            CANCELED: 0,
          });
          setTotalFilesAnalyzed(0);
        }
      } finally {
        if (isMounted) setRunsLoading(false);
      }
    }
    loadRunsMetrics();
    return () => {
      isMounted = false;
    };
  }, [dateRange]);

  const donutData = useMemo(() => buildDonutSegments(statusCounts), [statusCounts]);
  const runsTimeline = useMemo(
    () => buildRunsTimeline(runsInRange, dateRange.from, dateRange.to),
    [runsInRange, dateRange.from, dateRange.to],
  );
  const lineChartPoints = useMemo(
    () => buildLineChartPoints(runsTimeline, 460, 180, 20),
    [runsTimeline],
  );
  const severityDistribution = useMemo(
    () => buildSeverityDistribution(projectsForCharts),
    [projectsForCharts],
  );
  const topProjectsByScore = useMemo(
    () => [...projectsForCharts].sort((a, b) => b.score - a.score).slice(0, 5),
    [projectsForCharts],
  );
  const maxTopScore = useMemo(
    () => Math.max(1, ...topProjectsByScore.map((project) => Number(project.score || 0))),
    [topProjectsByScore],
  );
  const hallazgosPorSeveridad = [
    ['Criticos', severityDistribution.critical, '#b91c1c'],
    ['Altos', severityDistribution.high, '#ef4444'],
    ['Medios', severityDistribution.medium, '#f59e0b'],
    ['Bajos', severityDistribution.low, '#10b981'],
  ];
  const donutContent = (() => {
    if (runsLoading) return <LoadingState label="Cargando grafica..." />;
    if (donutData.total === 0) return <p className="dash-welcome-sub">No hay analisis en el rango seleccionado.</p>;
    return (
      <svg className="dash-donut-chart" viewBox="0 0 180 180" aria-label="Distribucion de estados de analisis">
        <g transform="translate(90 90) rotate(-90)">
          <circle r="66" fill="none" stroke="#eef2f7" strokeWidth="22" />
          {donutData.circles.map((segment) => (
            <circle
              key={segment.status}
              r="66"
              fill="none"
              stroke={segment.color}
              strokeWidth="22"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              strokeLinecap="butt"
            />
          ))}
        </g>
        <text x="90" y="84" textAnchor="middle" className="dash-donut-total-label">Total</text>
        <text x="90" y="106" textAnchor="middle" className="dash-donut-total-value">{donutData.total}</text>
      </svg>
    );
  })();
  const trendContent = (() => {
    if (runsLoading) return <LoadingState label="Cargando tendencia..." />;
    if (runsTimeline.length === 0) return <p className="dash-welcome-sub">No hay puntos para la tendencia.</p>;
    return (
      <svg className="dash-line-chart" viewBox="0 0 460 180" aria-label="Tendencia de analisis por dia">
        <rect x="0" y="0" width="460" height="180" rx="12" fill="rgba(30,58,95,0.03)" />
        <polyline
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={lineChartPoints}
        />
      </svg>
    );
  })();

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

      <section className="dash-chart-card" aria-label="Graficas de analisis">
        <header className="dash-section-header">
          <h2>Estados de analisis</h2>
        </header>

        <form
          className="dash-chart-filters"
          onSubmit={(e) => {
            e.preventDefault();
            setDateRange(dateFilter);
          }}
        >
          <label htmlFor="dash-date-from">
            <span>Desde</span>
            <input
              id="dash-date-from"
              type="date"
              value={dateFilter.from}
              onChange={(e) => setDateFilter((prev) => ({ ...prev, from: e.target.value }))}
            />
          </label>
          <label htmlFor="dash-date-to">
            <span>Hasta</span>
            <input
              id="dash-date-to"
              type="date"
              value={dateFilter.to}
              onChange={(e) => setDateFilter((prev) => ({ ...prev, to: e.target.value }))}
            />
          </label>
          <button type="submit">Aplicar filtro</button>
        </form>

        {runsError ? <p className="dash-welcome-sub">{runsError}</p> : null}

        <div className="dash-chart-grid">
          <article className="dash-chart-panel">
            <h3 className="dash-chart-title">Estados de analisis</h3>
            <div className="dash-chart-layout">
              <div className="dash-donut-wrap">
                {donutContent}
              </div>

              <ul className="dash-donut-legend" aria-label="Leyenda de estados">
                {donutData.entries.map((entry) => (
                  <li key={entry.status}>
                    <span className="dash-donut-dot" style={{ backgroundColor: entry.color }} />
                    <span className="dash-donut-label">{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="dash-chart-panel">
            <h3 className="dash-chart-title">Tendencia diaria de ejecuciones</h3>
            {trendContent}
          </article>

          <article className="dash-chart-panel">
            <h3 className="dash-chart-title">Hallazgos por severidad</h3>
            <div className="dash-bars">
              {hallazgosPorSeveridad.map(([label, value, color]) => (
                <div className="dash-bar-row" key={String(label)}>
                  <span>{label}</span>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{
                        width: `${Math.min(100, (Number(value) / Math.max(1, totalIssues)) * 100)}%`,
                        background: String(color),
                      }}
                    />
                  </div>
                  <strong>{Number(value)}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="dash-chart-panel">
            <h3 className="dash-chart-title">Top proyectos por score</h3>
            <div className="dash-bars">
              {topProjectsByScore.length === 0 ? (
                <p className="dash-welcome-sub">No hay proyectos para mostrar.</p>
              ) : topProjectsByScore.map((project) => (
                <div className="dash-bar-row" key={project.id}>
                  <span className="dash-bar-project-name">{project.name}</span>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{
                        width: `${Math.min(100, (Number(project.score || 0) / maxTopScore) * 100)}%`,
                        background: '#1e3a5f',
                      }}
                    />
                  </div>
                  <strong>{project.score}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
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
          <LoadingState variant="skeleton" count={3} label="Cargando proyectos..." />
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
