import { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field, value) {
  if (!value.trim()) return 'This field is required.';
  if (field === 'email' && !EMAIL_REGEX.test(value)) return 'Enter a valid email address.';
  if (field === 'password' && value.length < 6) return 'Password must be at least 6 characters.';
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
    if (!touched[name]) return 'auth-input';
    return errors[name] ? 'auth-input auth-input--error' : 'auth-input auth-input--valid';
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Codemio" className="auth-logo" />
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your Codemio account</p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Email */}
        <div className="auth-field">
          <label htmlFor="email" className="auth-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="password" className="auth-label">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            className={fieldClass('password')}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.password && errors.password && (
            <span className="auth-error-msg" role="alert">{errors.password}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Sign in'}
        </button>

        <p className="auth-footer-text">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="auth-link">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
