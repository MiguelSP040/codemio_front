import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './RegisterPage.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /\d/;

function validate(field, value, form) {
  if (!value.trim()) return 'This field is required.';

  switch (field) {
    case 'name':
      if (value.trim().length < 2) return 'Name must be at least 2 characters.';
      break;
    case 'email':
      if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address.';
      break;
    case 'password':
      if (value.length < 8) return 'Password must be at least 8 characters.';
      if (!HAS_UPPERCASE.test(value)) return 'Password must include at least one uppercase letter.';
      if (!HAS_NUMBER.test(value)) return 'Password must include at least one number.';
      break;
    case 'confirmPassword':
      if (value !== form.password) return 'Passwords do not match.';
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

  if (score <= 2) return { level: 'weak', label: 'Weak' };
  if (score <= 3) return { level: 'medium', label: 'Medium' };
  return { level: 'strong', label: 'Strong' };
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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start analyzing your Java code with Codemio</p>

        {serverError && (
          <div className="auth-server-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Name */}
        <div className="auth-field">
          <label htmlFor="name" className="auth-label">Full name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
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
            autoComplete="new-password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            className={fieldClass('password')}
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
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

        {/* Confirm Password */}
        <div className="auth-field">
          <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            className={fieldClass('confirmPassword')}
            value={form.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={loading}
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="auth-error-msg" role="alert">{errors.confirmPassword}</span>
          )}
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-spinner" /> : 'Create account'}
        </button>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
