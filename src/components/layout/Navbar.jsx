import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/images/codemio-logo.png';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const isProjectArea = location.pathname.startsWith('/projects');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/login" className="navbar-brand">
          <img src={logo} alt="Codemio" className="navbar-logo" />
          <span className="navbar-title">Codemio</span>
        </Link>
        <ul className="navbar-links">
          <li><Link to="/">Inicio</Link></li>
          {isProjectArea ? (
            <li><Link to="/projects">Proyectos</Link></li>
          ) : (
            <>
              <li><Link to="/login">Ingresar</Link></li>
              <li><Link to="/register">Registro</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
