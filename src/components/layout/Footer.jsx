import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} Codemio — Análisis de código Java</p>
      </div>
    </footer>
  );
}
