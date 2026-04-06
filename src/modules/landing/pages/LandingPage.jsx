import logoCompleto from '../../../assets/images/codemio-logo-completo.png';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <img
          src={logoCompleto}
          alt="Codemio - Java Code Analysis"
          className="landing-logo"
        />
        <h1>Analyze your Java code with confidence</h1>
        <p className="landing-subtitle">
          Static analysis tool for Java projects. Upload your code, get insights, and improve quality.
        </p>
      </section>
    </div>
  );
}
