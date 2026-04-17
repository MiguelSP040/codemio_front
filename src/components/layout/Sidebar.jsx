import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/codemio-logo.png';
import './Sidebar.css';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const displayName = user?.nombre || user?.name || user?.email || 'Usuario';
  const displayEmail = user?.correo || user?.email || '';
  const role = user?.rol || user?.role || null;
  const isAdmin = role === 'admin';

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-brand">
          <img src={logo} alt="Codemio" className="sidebar-logo" />
          <span className="sidebar-brand-name">Codemio</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Navegacion principal">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="sidebar-link-text">Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="sidebar-link-text">Proyectos</span>
          </NavLink>

          <NavLink
            to="/analysis"
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span className="sidebar-link-text">Analisis</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
              onClick={onClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="sidebar-link-text">Usuarios</span>
            </NavLink>
          )}
        </nav>

        {/* User section */}
        <div className="sidebar-user">
          <div className="sidebar-avatar" aria-hidden="true" title={displayName}>
            {getInitials(displayName)}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{displayName}</span>
            {displayEmail && (
              <span className="sidebar-user-email">{displayEmail}</span>
            )}
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>

        {/* Mobile close */}
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Cerrar menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </aside>
    </>
  );
}
