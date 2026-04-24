import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { completeProfile } from '../services/onboardingService';
import { useAuth } from '../../../context/AuthContext';
import { sanitizePlainText } from '../../../utils/validation';
import { extractApiErrorMessage } from '../../../utils/apiErrors';
import {
  INITIAL_PROFILE_ERRORS,
  INITIAL_PROFILE_FORM,
  INITIAL_PROFILE_TOUCHED,
  PROFILE_FIELDS,
  validateProfileField,
} from '../../../utils/profileFields';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './OnboardingPage.css';

function normalizeAgeInput(value) {
  return String(value ?? '').replaceAll(/\D/g, '').slice(0, 3);
}

function handleAgeKeyDown(e) {
  if (['e', 'E', '+', '-', '.'].includes(e.key)) {
    e.preventDefault();
  }
}
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, onboardingCompleted, setUser } = useAuth();
  const [form, setForm] = useState(INITIAL_PROFILE_FORM);
  const [errors, setErrors] = useState(INITIAL_PROFILE_ERRORS);
  const [touched, setTouched] = useState(INITIAL_PROFILE_TOUCHED);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (onboardingCompleted) return <Navigate to="/dashboard" replace />;

  function handleChange(e) {
    const { name, value } = e.target;
    const nextValue = name === 'edad' ? normalizeAgeInput(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setServerError('');

    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateProfileField(name, nextValue, { edadRequired: true }),
      }));
    }
  }

  function handleAgePaste(e) {
    e.preventDefault();
    const pasted = normalizeAgeInput(e.clipboardData?.getData('text') || '');
    setForm((prev) => ({ ...prev, edad: pasted }));
    setServerError('');
    if (touched.edad) {
      setErrors((prev) => ({
        ...prev,
        edad: validateProfileField('edad', pasted, { edadRequired: true }),
      }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateProfileField(name, value, { edadRequired: true }),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    for (const field of PROFILE_FIELDS) {
      newErrors[field] = validateProfileField(field, form[field], { edadRequired: true });
    }
    setErrors(newErrors);
    setTouched({ nombre: true, edad: true, perfil_github: true });

    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    setServerError('');

    try {
      const updatedUser = await completeProfile({
        nombre: sanitizePlainText(form.nombre),
        edad: Number(form.edad),
        perfil_github: sanitizePlainText(form.perfil_github) || null,
      });
      setUser(updatedUser);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(extractApiErrorMessage(err));
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
            maxLength={100}
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
            type="text"
            inputMode="numeric"
            min="13"
            max="120"
            step="1"
            maxLength={3}
            placeholder="Ej: 21"
            className={fieldClass('edad')}
            value={form.edad}
            onChange={handleChange}
            onKeyDown={handleAgeKeyDown}
            onPaste={handleAgePaste}
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
              maxLength={255}
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
