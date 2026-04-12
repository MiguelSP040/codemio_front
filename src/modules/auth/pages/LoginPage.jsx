import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import './LoginPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field, value) {
  if (!value.trim()) return 'Este campo es obligatorio.';
  if (field === 'email' && !EMAIL_REGEX.test(value)) return 'Ingresa una dirección de correo válida.';
  if (field === 'password' && value.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  return '';
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
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

    const newErrors = {
      email: validate('email', form.email),
      password: validate('password', form.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (newErrors.email || newErrors.password) return;

    setLoading(true);
    setServerError('');

    try {
      const data = await login(form);
      // TODO: store token / redirect to dashboard
      console.log('Login success:', data);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  function fieldClass(name) {
    if (!touched[name]) return 'login-input';
    return errors[name] ? 'login-input login-input--error' : 'login-input login-input--valid';
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Codemio" className="login-logo" />
        <h1 className="login-title">Bienvenido de nuevo</h1>
        <p className="login-subtitle">Inicia sesión en tu cuenta de Codemio</p>

        {serverError && (
          <div className="login-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Email */}
        <div className="login-field">
          <label htmlFor="email" className="login-label">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className={fieldClass('email')}
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.email && errors.email && (
            <span className="login-error-msg" role="alert">{errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="login-field">
          <label htmlFor="password" className="login-label">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Ingresa tu contraseña"
            className={fieldClass('password')}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.password && errors.password && (
            <span className="login-error-msg" role="alert">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <span className="login-spinner" /> : 'Ingresar'}
        </button>

        <p className="login-footer-text">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="login-link">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
