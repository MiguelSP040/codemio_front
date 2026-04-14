import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, githubAuth } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './RegisterPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;

function validate(field, value, form) {
  if (!value.trim()) return 'Este campo es obligatorio.';

  switch (field) {
    case 'name':
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
      break;
    case 'email':
      if (!EMAIL_REGEX.test(value)) return 'Ingresa un correo electrónico válido.';
      break;
    case 'password':
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
      if (!HAS_UPPERCASE.test(value)) return 'La contraseña debe incluir al menos una mayúscula.';
      if (!HAS_NUMBER.test(value)) return 'La contraseña debe incluir al menos un número.';
      break;
    case 'confirmPassword':
      if (value !== form.password) return 'Las contraseñas no coinciden.';
      break;
  }

  return '';
}

function getPasswordStrength(password) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (HAS_UPPERCASE.test(password)) score++;
  if (HAS_NUMBER.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', label: 'Débil' };
  if (score <= 3) return { level: 'medium', label: 'Media' };
  return { level: 'strong', label: 'Fuerte' };
}

const FIELDS = ['name', 'email', 'password', 'confirmPassword'];

const INITIAL_FORM = { name: '', email: '', password: '', confirmPassword: '' };
const INITIAL_TOUCHED = { name: false, email: false, password: false, confirmPassword: false };
const INITIAL_ERRORS = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(form.password);

  function handleChange(e) {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    setForm(next);
    setServerError('');

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value, next) }));
    }

    if (name === 'password' && touched.confirmPassword && next.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validate('confirmPassword', next.confirmPassword, next),
      }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value, form) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    for (const field of FIELDS) {
      newErrors[field] = validate(field, form[field], form);
    }
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    setServerError('');

    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/login', { state: { registered: true } });
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
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Codemio" className="auth-logo" />
        <h1 className="auth-title">Crea tu cuenta</h1>
        <p className="auth-subtitle">Comienza a analizar tu código Java con Codemio</p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Nombre */}
        <div className="auth-field">
          <label htmlFor="name" className="auth-label">Nombre completo</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre completo"
            className={fieldClass('name')}
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.name && errors.name && (
            <span className="auth-error-msg" role="alert">{errors.name}</span>
          )}
        </div>

        {/* Correo electrónico */}
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="codemio@gmail.com"
            className={fieldClass('email')}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.email && errors.email && (
            <span className="auth-error-msg" role="alert">{errors.email}</span>
          )}
        </div>

        {/* Contraseña */}
        <div className="auth-field">
          <label htmlFor="password" className="auth-label">Contraseña</label>
          <div className="auth-input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
              className={fieldClass('password')}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
            <button
              type="button"
              className="auth-toggle-password"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {touched.password && errors.password && (
            <span className="auth-error-msg" role="alert">{errors.password}</span>
          )}
          {strength && (
            <div className="password-strength">
              <div className="password-strength-bar">
                <div className={`password-strength-fill password-strength--${strength.level}`} />
              </div>
              <span className={`password-strength-label password-strength-text--${strength.level}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="auth-field">
          <label htmlFor="confirmPassword" className="auth-label">Confirmar contraseña</label>
          <div className="auth-input-wrapper">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Vuelve a ingresar tu contraseña"
              className={fieldClass('confirmPassword')}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
            <button
              type="button"
              className="auth-toggle-password"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="auth-error-msg" role="alert">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Crear cuenta'}
        </button>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <button type="button" className="auth-btn-github" onClick={githubAuth}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
          Registrarse con GitHub
        </button>

        <p className="auth-footer-text">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
