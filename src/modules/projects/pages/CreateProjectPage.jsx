import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createProject } from '../services/projectService';
import { extractApiErrorMessage } from '../../../utils/apiErrors';
import { validateProjectName } from '../../../utils/validation';
import './CreateProjectPage.css';

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  function handleChange(e) {
    setName(e.target.value);
    setServerError('');
    if (touched) setError(validateProjectName(e.target.value));
  }

  function handleBlur() {
    setTouched(true);
    setError(validateProjectName(name));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const err = validateProjectName(name);
    setError(err);
    setTouched(true);
    if (err) return;

    setLoading(true);
    setServerError('');

    try {
      const project = await createProject({ name: name.trim() });
      setCreated(project);
    } catch (err) {
      setServerError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function inputClass() {
    if (!touched) return 'new-project-input';
    return error
      ? 'new-project-input new-project-input--error'
      : 'new-project-input new-project-input--valid';
  }

  return (
    <div className="new-project-page">
      <div className="new-project-card">
        {/* Icon */}
        <div className="new-project-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </div>

        {/* Header */}
        <div className="new-project-header">
          <h1 className="new-project-title">Nuevo proyecto</h1>
          <p className="new-project-subtitle">
            Crea un proyecto para comenzar a analizar tu código Java
          </p>
        </div>

        {created ? (
          /* Success state */
          <div className="new-project-success">
            <div className="new-project-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="new-project-success-text">
              Proyecto <span className="new-project-success-name">{created.name}</span> creado exitosamente
            </p>
            <div className="new-project-success-actions">
              <button
                type="button"
                className="new-project-submit"
                onClick={() => navigate('/projects')}
              >
                Ver mis proyectos
              </button>
              <button
                type="button"
                className="new-project-back"
                onClick={() => { setCreated(null); setName(''); setTouched(false); setError(''); }}
              >
                Crear otro proyecto
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form className="new-project-form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="new-project-error" role="alert">
                {serverError}
              </div>
            )}

            <div className="new-project-field">
              <label htmlFor="project-name" className="new-project-label">
                Nombre del proyecto
              </label>
              <input
                id="project-name"
                type="text"
                placeholder="Ej: Mi proyecto Java"
                className={inputClass()}
                value={name}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                maxLength={49}
                autoFocus
              />
              {touched && error ? (
                <span className="new-project-field-error" role="alert">{error}</span>
              ) : (
                <span className="new-project-hint">Usa un nombre corto, legible y sin caracteres raros.</span>
              )}
            </div>

            <button type="submit" className="new-project-submit" disabled={loading}>
              {loading ? (
                <span className="new-project-spinner" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Crear proyecto
                </>
              )}
            </button>
          </form>
        )}

        <Link to="/projects" className="new-project-back">
          Volver a proyectos
        </Link>
      </div>
    </div>
  );
}
