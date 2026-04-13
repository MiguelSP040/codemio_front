import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div style={{ width: 'min(720px, 100%)', margin: '0 auto', padding: '48px 20px' }}>
      <h1>Registro</h1>
      <p style={{ color: 'var(--color-text-light)', marginTop: '8px' }}>
        Esta pantalla se conectara en el siguiente paso del flujo. Por ahora, usa Ingresar para
        continuar.
      </p>
      <Link to="/login" style={{ display: 'inline-block', marginTop: '16px' }}>
        Ir a Ingresar
      </Link>
    </div>
  );
}
