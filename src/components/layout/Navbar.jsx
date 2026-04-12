import { Link } from 'react-router-dom';
import logo from '../../assets/images/codemio-logo.png';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/login" className="navbar-brand">
          <img src={logo} alt="Codemio" className="navbar-logo" />
          <span className="navbar-title">Codemio</span>
        </Link>
        <ul className="navbar-links">
          <li><Link to="/login">Iniciar sesión</Link></li>
        </ul>
      </div>
    </nav>
  );
}
