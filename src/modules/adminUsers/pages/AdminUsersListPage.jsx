import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { deleteUser, listUsers } from '../services/adminUsersService';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import './adminUsers.css';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function normalize(value) {
  return (value ?? '').toString().trim().toLowerCase();
}

export default function AdminUsersListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [query, setQuery] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setServerError('');
    try {
      const data = await listUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'No se pudieron cargar los usuarios.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return users;
    return users.filter((u) => {
      const name = normalize(u?.nombre);
      const email = normalize(u?.correo);
      const github = normalize(u?.perfil_github);
      return name.includes(q) || email.includes(q) || github.includes(q);
    });
  }, [users, query]);

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setServerError('');
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'No se pudo eliminar el usuario.';
      setServerError(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="admin-users-page">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description={
          <>
            Consulta, edita y elimina usuarios. Solo puedes modificar <strong>nombre</strong>, <strong>edad</strong> y <strong>perfil de GitHub</strong>.
          </>
        }
      />

      {serverError && <div className="admin-users-error" role="alert">{serverError}</div>}

      <div className="admin-users-toolbar">
        <input
          className="admin-users-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, correo o GitHub…"
          aria-label="Buscar usuarios"
        />
        <span className="admin-users-count">{filtered.length} usuarios</span>
      </div>

      <div className="admin-users-table-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Edad</th>
              <th>GitHub</th>
              <th>Fecha registro</th>
              <th>Cognito</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-users-empty">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="admin-users-empty">No hay usuarios para mostrar.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link className="admin-users-link" to={`/admin/users/${u.id}`}>
                      {u.nombre || '—'}
                    </Link>
                    <div className="admin-users-muted">{u.correo || '—'}</div>
                  </td>
                  <td>{u.edad ?? '—'}</td>
                  <td>{u.perfil_github || '—'}</td>
                  <td>{formatDate(u.fecha_registro)}</td>
                  <td>
                    <span className={`admin-users-pill ${u?.cognito?.email_verified ? 'admin-users-pill--ok' : 'admin-users-pill--warn'}`}>
                      {u?.cognito?.email_verified ? 'Verificado' : 'No verificado'}
                    </span>
                  </td>
                  <td className="admin-users-actions">
                    <button
                      type="button"
                      className="projects-card-btn projects-card-btn--delete"
                      onClick={() => setDeleteTarget(u)}
                      aria-label={`Eliminar usuario ${u.nombre}`}
                      title="Eliminar usuario"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        loading={deleting}
        title="Eliminar usuario"
        description={
          deleteTarget
            ? `Vas a eliminar a ${deleteTarget.correo || 'este usuario'}. Esta acción no se puede deshacer.`
            : ''
        }
        onCancel={() => (deleting ? null : setDeleteTarget(null))}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

