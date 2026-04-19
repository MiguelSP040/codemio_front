import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { registerAccount } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './RegisterPage.css';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;

function validate(field, value, form) {
  if (!value.trim()) return 'Este campo es obligatorio.';

  switch (field) {
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

const FIELDS = ['password', 'confirmPassword'];
const INITIAL_FORM = { password: '', confirmPassword: '' };
const INITIAL_ERRORS = { password: '', confirmPassword: '' };
const INITIAL_TOUCHED = { password: false, confirmPassword: false };

export default function CreatePasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAuth } = useAuth();
  const email = location.state?.email ?? '';

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    if (!email) navigate('/register', { replace: true });
  }, [email, navigate]);

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
    setTouched({ password: true, confirmPassword: true });

    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    setServerError('');

    try {
      const data = await registerAccount({ email, password: form.password });
      loginAuth(data);
      navigate('/onboarding', { state: { email } });
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
        <h1 className="auth-title">Crea tu contraseña</h1>
        <p className="auth-subtitle">
          Elige una contraseña segura para tu cuenta <strong>{email}</strong>
        </p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

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
              aria-label="Contraseña nueva"
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
              aria-label="Confirmar contraseña nueva"
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
          {loading ? <span className="auth-spinner" /> : 'Crear contraseña'}
        </button>

        <p className="auth-footer-text">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="auth-link">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
