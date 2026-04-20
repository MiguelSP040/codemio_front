import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CodeInput from '../../../components/forms/CodeInput';
import { resendVerificationCode, validateOtp } from '../services/onboardingService';
import { isValidOtp } from '../../../utils/validation';
import { getAuthErrorMessage } from '../utils/authErrorMessages';
import logo from '../../../assets/images/codemio-logo-completo.png';
import '../styles/auth.css';
import './VerifyEmailPage.css';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 45;

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? '';
  const flow = location.state?.flow ?? 'register'; // 'register' | 'recovery'
  const isRecovery = flow === 'recovery';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resending, setResending] = useState(false);
  const codeInputKey = useRef(0);

  // Si no viene email en state, devolvemos al paso anterior
  useEffect(() => {
    if (!email) navigate(isRecovery ? '/forgot-password' : '/register', { replace: true });
  }, [email, navigate, isRecovery]);

  // Cooldown para reenviar código
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function resetCodeInput() {
    codeInputKey.current += 1;
    setCode('');
  }

  async function handleComplete(fullCode) {
    if (loading) return;
    if (!isValidOtp(fullCode)) {
      setError('El código debe tener exactamente 6 dígitos y solo números.');
      resetCodeInput();
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await validateOtp({ email, otp: fullCode, flow });
      // Redirige según el flujo: registro → crear contraseña, recovery → nueva contraseña
      const nextRoute = isRecovery ? '/reset-password' : '/create-password';
      navigate(nextRoute, {
        replace: true,
        state: isRecovery ? { email, code: fullCode } : { email },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'El código no es válido. Inténtalo de nuevo.'));
      resetCodeInput();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfo('');

    try {
      await resendVerificationCode({ email });
      setInfo('Te enviamos un nuevo código. Revisa tu correo.');
      setCooldown(RESEND_COOLDOWN_S);
      resetCodeInput();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'No pudimos reenviar el código. Inténtalo de nuevo.'));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        <img src={logo} alt="Codemio" className="auth-logo" />

        <div className="verify-header">
          <div className="verify-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h1 className="auth-title">Verifica tu correo</h1>
          <p className="auth-subtitle">
            Enviamos un código de {CODE_LENGTH} dígitos a{' '}
            <strong className="verify-email">{email || 'tu correo'}</strong>. Si no lo
            encuentras, revisa tu bandeja de correos no deseados.
          </p>
        </div>

        {error && (
          <div className="auth-server-error" role="alert">
            {error}
          </div>
        )}
        {info && !error && (
          <div className="verify-info" role="status">
            {info}
          </div>
        )}

        <div className="verify-code-wrap">
          <CodeInput
            key={codeInputKey.current}
            length={CODE_LENGTH}
            onChange={setCode}
            onComplete={handleComplete}
            error={Boolean(error)}
            disabled={loading}
            ariaLabel="Código de verificación de correo"
          />
          {loading && (
            <div className="verify-loading" aria-live="polite">
              <span className="auth-spinner verify-spinner" />
              <span>Verificando código…</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="auth-btn"
          disabled={loading || code.length < CODE_LENGTH}
          onClick={() => handleComplete(code)}
        >
          {loading ? <span className="auth-spinner" /> : 'Verificar'}
        </button>

        <div className="verify-resend">
          <span>¿No recibiste el código?</span>{' '}
          {cooldown > 0 ? (
            <span className="verify-resend-timer">
              Reenviar en <strong>{cooldown}s</strong>
            </span>
          ) : (
            <button
              type="button"
              className="verify-resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Enviando…' : 'Reenviar código'}
            </button>
          )}
        </div>

        <p className="auth-footer-text">
          ¿Correo incorrecto?{' '}
          <Link to={isRecovery ? '/forgot-password' : '/register'} className="auth-link">
            {isRecovery ? 'Volver a recuperación' : 'Volver al registro'}
          </Link>
        </p>
      </div>
    </div>
  );
}
