import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeProfile } from '../services/onboardingService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './OnboardingPage.css';

function validate(field, value) {
  switch (field) {
    case 'nombre':
      if (!value.trim()) return 'Este campo es obligatorio.';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      break;
    case 'edad':
      if (!value && value !== 0) return 'Este campo es obligatorio.';
      if (isNaN(value) || !Number.isInteger(Number(value))) return 'Ingresa un número entero.';
      if (Number(value) < 13) return 'Debes tener al menos 13 años.';
      if (Number(value) > 120) return 'Ingresa una edad válida.';
      break;
    case 'perfil_github':
      if (value && value.trim() && !/^https:\/\/github\.com\/[\w.-]+\/?$/.test(value.trim())) {
        return 'Ingresa una URL válida (ej: https://github.com/usuario)';
      }
      break;
  }
  return '';
}

const FIELDS = ['nombre', 'edad', 'perfil_github'];
const INITIAL_FORM = { nombre: '', edad: '', perfil_github: '' };
const INITIAL_ERRORS = { nombre: '', edad: '', perfil_github: '' };
const INITIAL_TOUCHED = { nombre: false, edad: false, perfil_github: false };

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerError('');

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    for (const field of FIELDS) {
      newErrors[field] = validate(field, form[field]);
    }
    setErrors(newErrors);
    setTouched({ nombre: true, edad: true, perfil_github: true });

    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    setServerError('');

    try {
      await completeProfile({
        nombre: form.nombre.trim(),
        edad: Number(form.edad),
        perfil_github: form.perfil_github.trim() || null,
      });
      // TODO (rama de integración): actualizar AuthContext con `onboarding_completed: true`
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Algo salió mal. Inténtalo de nuevo.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fieldClass(name) {
    if (!touched[name]) return 'auth-input';
    return errors[name] ? 'auth-input auth-input--error' : 'auth-input auth-input--valid';
  }

  return (
    <div className="auth-page">
      <form className="auth-card onboarding-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Codemio" className="auth-logo" />
        <h1 className="auth-title">Completa tu perfil</h1>
        <p className="auth-subtitle">
          Cuéntanos un poco sobre ti para personalizar tu experiencia
        </p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Nombre completo */}
        <div className="auth-field">
          <label htmlFor="nombre" className="auth-label">Nombre completo</label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className={fieldClass('nombre')}
            value={form.nombre}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.nombre && errors.nombre && (
            <span className="auth-error-msg" role="alert">{errors.nombre}</span>
          )}
        </div>

        {/* Edad */}
        <div className="auth-field">
          <label htmlFor="edad" className="auth-label">Edad</label>
          <input
            id="edad"
            name="edad"
            type="number"
            inputMode="numeric"
            min="13"
            max="120"
            placeholder="Ej: 21"
            className={fieldClass('edad')}
            value={form.edad}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.edad && errors.edad && (
            <span className="auth-error-msg" role="alert">{errors.edad}</span>
          )}
        </div>

        {/* Perfil de GitHub */}
        <div className="auth-field">
          <label htmlFor="perfil_github" className="auth-label">
            Perfil de GitHub <span className="onboarding-optional">(opcional)</span>
          </label>
          <div className="auth-input-wrapper">
            <span className="onboarding-input-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </span>
            <input
              id="perfil_github"
              name="perfil_github"
              type="url"
              autoComplete="url"
              placeholder="https://github.com/tu-usuario"
              className={`${fieldClass('perfil_github')} onboarding-github-input`}
              value={form.perfil_github}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </div>
          {touched.perfil_github && errors.perfil_github && (
            <span className="auth-error-msg" role="alert">{errors.perfil_github}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Completar perfil'}
        </button>
      </form>
    </div>
  );
}
