import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createProject } from '../../projects/services/projectService';
import './ProjectsPage.css';

/* --- Mock data (TODO: Real API) --- */
const initialProjects = [
  {
    id: 'auditoria-java',
    name: 'servicio-de-auditoria-estatica-java',
    description: 'Proyecto principal de analisis estatico para Java.',
    lastAnalysis: 'Ultimo analisis: hace 2 h',
  },
  {
    id: 'api-clientes',
    name: 'servicio-api-clientes-java',
    description: 'API de clientes con reglas de validacion y seguridad.',
    lastAnalysis: 'Ultimo analisis: hace 5 h',
  },
  {
    id: 'motor-reglas',
    name: 'motor-reglas-empresariales-java',
    description: 'Motor de reglas para flujos de evaluacion automatica.',
    lastAnalysis: 'Ultimo analisis: ayer',
  },
];

function validate(value) {
  if (!value.trim()) return 'Este campo es obligatorio.';
  if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
  if (value.trim().length > 100) return 'El nombre no puede exceder 100 caracteres.';
  return '';
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);

  /* Create-form state */
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  function handleChange(e) {
    setName(e.target.value);
    setServerError('');
    if (touched) setError(validate(e.target.value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(name));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate(name);
    setError(err);
    setTouched(true);
    if (err) return;

    setLoading(true);
    setServerError('');

    try {
      const project = await createProject({ name: name.trim() });
      setCreated(project);
      setProjects((prev) => [
        { id: String(project.id), name: project.name, description: '', lastAnalysis: 'Recien creado' },
        ...prev,
      ]);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Algo salio mal. Intentalo de nuevo.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCreated(null);
    setName('');
    setTouched(false);
    setError('');
    setServerError('');
  }

  function closePanel() {
    resetForm();
    setShowForm(false);
  }

  function inputClass() {
    if (!touched) return 'pj-input';
    return error ? 'pj-input pj-input--error' : 'pj-input pj-input--valid';
  }

  return (
    <div className="projects-page">
      {/* Header */}
      <header className="projects-header">
        <div className="projects-header-top">
          <div>
            <p className="projects-eyebrow">Seleccion de proyecto</p>
            <h1>Proyectos disponibles</h1>
            <p>Selecciona un proyecto para abrir su dashboard y revisar archivos analizados.</p>
          </div>
          {!showForm && (
            <button type="button" className="projects-create-btn" onClick={() => setShowForm(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nuevo proyecto
            </button>
          )}
        </div>
      </header>

      {/* Split layout: list + form panel */}
      <div className={`projects-split${showForm ? ' projects-split--open' : ''}`}>
        {/* Left: project list */}
        <section className="projects-list" aria-label="Lista de proyectos">
          {projects.map((project) => (
            <article className="projects-card" key={project.id}>
              <h2>{project.name}</h2>
              {project.description && <p>{project.description}</p>}
              <p className="projects-analysis-time">{project.lastAnalysis}</p>
              <Link className="projects-open-btn" to={`/projects/${project.id}/dashboard`}>
                Abrir dashboard
              </Link>
            </article>
          ))}

          {projects.length === 0 && (
            <div className="projects-empty">
              <p>No tienes proyectos aun.</p>
              <button type="button" className="projects-create-btn" onClick={() => setShowForm(true)}>
                Crear tu primer proyecto
              </button>
            </div>
          )}
        </section>

        {/* Right: create panel */}
        {showForm && (
          <aside className="projects-panel" aria-label="Crear proyecto">
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

            {created ? (
              <div className="pj-success">
                <div className="pj-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="pj-success-text">
                  Proyecto <strong>{created.name}</strong> creado exitosamente
                </p>
                <div className="pj-success-actions">
                  <Link to={`/projects/${created.id}/dashboard`} className="pj-btn pj-btn--primary">
                    Abrir dashboard
                  </Link>
                  <button type="button" className="pj-btn pj-btn--ghost" onClick={resetForm}>
                    Crear otro proyecto
                  </button>
                </div>
              </div>
            ) : (
              <form className="pj-form" onSubmit={handleSubmit} noValidate>
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
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
