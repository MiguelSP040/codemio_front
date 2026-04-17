import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(value) {
  if (!value.trim()) return 'Este campo es obligatorio.';
  if (!EMAIL_REGEX.test(value)) return 'Ingresa un correo electrónico válido.';
  return '';
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setEmail(e.target.value);
    setServerError('');

    if (touched) {
      setError(validate(e.target.value));
    }
  }

  function handleBlur() {
    setTouched(true);
    setError(validate(email));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newError = validate(email);
    setError(newError);
    setTouched(true);

    if (newError) return;

    setLoading(true);
    setServerError('');

    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      // Reutilizamos la vista de código OTP, indicando flow: 'recovery'
      // para que al verificar el código redirija a /reset-password en vez de /create-password
      navigate('/verify-email', { state: { email: email.trim().toLowerCase(), flow: 'recovery' } });
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

  function fieldClass() {
    if (!touched) return 'auth-input';
    return error ? 'auth-input auth-input--error' : 'auth-input auth-input--valid';
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Codemio" className="auth-logo" />
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle">
          Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña
        </p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Correo electrónico */}
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            className={fieldClass()}
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
            aria-label="Correo electrónico para recuperación"
          />
          {touched && error && (
            <span className="auth-error-msg" role="alert">{error}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Enviar código'}
        </button>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">Volver al inicio de sesión</Link>
        </p>
      </form>
    </div>
  );
}
