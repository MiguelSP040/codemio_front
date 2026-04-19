import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { deleteUser, getUserById, updateUser } from '../services/adminUsersService';
import PageHeader from '../../../components/ui/PageHeader/PageHeader';
import {
  sanitizePlainText,
  validateEdad,
  validateNombre,
  validatePerfilGithub,
} from '../../../utils/validation';
import './adminUsers.css';

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function validate(field, value) {
  switch (field) {
    case 'nombre':
      return validateNombre(value, { required: true });
    case 'edad':
      return validateEdad(value, { required: false });
    case 'perfil_github':
      return validatePerfilGithub(value, { required: false });
    default:
      return '';
  }
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({ nombre: '', edad: '', perfil_github: '' });
  const [touched, setTouched] = useState({ nombre: false, edad: false, perfil_github: false });
  const [errors, setErrors] = useState({ nombre: '', edad: '', perfil_github: '' });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setServerError('');
    try {
      const data = await getUserById(id);
      setUser(data);
      setForm({
        nombre: data?.nombre ?? '',
        edad: data?.edad ?? '',
        perfil_github: data?.perfil_github ?? '',
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'No se pudo cargar el usuario.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      (form.nombre ?? '') !== (user.nombre ?? '') ||
      String(form.edad ?? '') !== String(user.edad ?? '') ||
      (form.perfil_github ?? '') !== (user.perfil_github ?? '')
    );
  }, [form, user]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setServerError('');
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validate(name, value) }));
  }

  async function handleSave() {
    if (!user || saving) return;

    const nextErrors = {
      nombre: validate('nombre', form.nombre),
      edad: validate('edad', form.edad),
      perfil_github: validate('perfil_github', form.perfil_github),
    };
    setErrors(nextErrors);
    setTouched({ nombre: true, edad: true, perfil_github: true });
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    setServerError('');
    try {
      const payload = {
        nombre: sanitizePlainText(form.nombre),
        edad: form.edad === '' ? null : Number(form.edad),
        perfil_github: sanitizePlainText(form.perfil_github) || null,
      };
      const updated = await updateUser(user.id, payload);
      setUser(updated);
      setForm({
        nombre: updated?.nombre ?? '',
        edad: updated?.edad ?? '',
        perfil_github: updated?.perfil_github ?? '',
      });
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'No se pudo guardar.';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!user || deleting) return;
    setDeleting(true);
    setServerError('');
    try {
      await deleteUser(user.id);
      navigate('/admin/users', { replace: true });
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
        title="Detalle de usuario"
        description={
          <>
            Solo puedes editar <strong>nombre</strong>, <strong>edad</strong> y <strong>perfil de GitHub</strong>.
          </>
        }
        action={
          <div className="admin-users-header-actions">
            <Link className="projects-card-btn" to="/admin/users" aria-label="Volver a la lista" title="Volver">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <button
              type="button"
              className="projects-card-btn projects-card-btn--delete"
              onClick={() => setDeleteOpen(true)}
              disabled={loading || !user}
              aria-label="Eliminar usuario"
              title="Eliminar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        }
      />

      {serverError && <div className="admin-users-error" role="alert">{serverError}</div>}

      {loading ? (
        <div className="admin-users-card">Cargando usuario…</div>
      ) : !user ? (
        <div className="admin-users-card">No encontramos el usuario.</div>
      ) : (
        <div className="admin-users-grid">
          <section className="admin-users-card">
            <h2 className="admin-users-card-title">Datos (solo lectura)</h2>
            <dl className="admin-users-dl">
              <div>
                <dt>Correo</dt>
                <dd>{user.correo || '—'}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>{user.rol || '—'}</dd>
              </div>
              <div>
                <dt>Fecha registro</dt>
                <dd>{formatDate(user.fecha_registro)}</dd>
              </div>
            </dl>

            <h3 className="admin-users-card-subtitle">Cognito</h3>
            <dl className="admin-users-dl">
              <div>
                <dt>Estado</dt>
                <dd>{user?.cognito?.user_status || '—'}</dd>
              </div>
              <div>
                <dt>Email verificado</dt>
                <dd>{user?.cognito?.email_verified ? 'Sí' : 'No'}</dd>
              </div>
              <div>
                <dt>Habilitado</dt>
                <dd>{user?.cognito?.enabled === null || user?.cognito?.enabled === undefined ? '—' : (user?.cognito?.enabled ? 'Sí' : 'No')}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-users-card">
            <h2 className="admin-users-card-title">Editar</h2>

            <div className="admin-users-form">
              <div className="admin-users-field">
                <label className="admin-users-label" htmlFor="nombre">Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  className={`admin-users-input${errors.nombre ? ' admin-users-input--error' : ''}`}
                  value={form.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.nombre && errors.nombre && <span className="admin-users-help" role="alert">{errors.nombre}</span>}
              </div>

              <div className="admin-users-field">
                <label className="admin-users-label" htmlFor="edad">Edad</label>
                <input
                  id="edad"
                  name="edad"
                  type="number"
                  inputMode="numeric"
                  className={`admin-users-input${errors.edad ? ' admin-users-input--error' : ''}`}
                  value={form.edad}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                />
                {touched.edad && errors.edad && <span className="admin-users-help" role="alert">{errors.edad}</span>}
              </div>

              <div className="admin-users-field">
                <label className="admin-users-label" htmlFor="perfil_github">Perfil GitHub</label>
                <input
                  id="perfil_github"
                  name="perfil_github"
                  className={`admin-users-input${errors.perfil_github ? ' admin-users-input--error' : ''}`}
                  value={form.perfil_github}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={saving}
                  placeholder="usuario o URL"
                />
                {touched.perfil_github && errors.perfil_github && <span className="admin-users-help" role="alert">{errors.perfil_github}</span>}
                <p className="admin-users-muted">
                  No puedes editar correo ni rol desde aquí.
                </p>
              </div>

              <div className="admin-users-form-actions">
                <button
                  type="button"
                  className="pj-btn pj-btn--primary"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                >
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      <ConfirmDeleteModal
        open={deleteOpen}
        loading={deleting}
        title="Eliminar usuario"
        description={user ? `Vas a eliminar a ${user.correo}. Esta acción no se puede deshacer.` : ''}
        onCancel={() => (deleting ? null : setDeleteOpen(false))}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

