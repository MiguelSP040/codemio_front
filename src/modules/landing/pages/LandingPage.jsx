import logoCompleto from '../../../assets/images/codemio-logo-completo.png';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <img
          src={logoCompleto}
          alt="Codemio - Análisis de código Java"
          className="landing-logo"
        />
        <h1>Analiza tu código Java con confianza</h1>
        <p className="landing-subtitle">
          Herramienta de análisis estático para proyectos Java. Sube tu código, obtén hallazgos y mejora su calidad.
        </p>
      </section>
    </div>
  );
}
