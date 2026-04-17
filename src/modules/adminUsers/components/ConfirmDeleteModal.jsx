import '../pages/adminUsers.css';

export default function ConfirmDeleteModal({
  open,
  title = 'Eliminar usuario',
  description,
  confirmText = 'Sí, eliminar',
  cancelText = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="admin-users-modal-backdrop" onClick={onCancel} role="presentation">
      <div className="admin-users-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="admin-users-modal-title">{title}</h3>
        <p className="admin-users-modal-text">
          {description || 'Esta acción eliminará el usuario de la base de datos local y de Cognito.'}
        </p>
        <div className="admin-users-modal-actions">
          <button
            type="button"
            className="admin-users-btn admin-users-btn--ghost"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="admin-users-btn admin-users-btn--danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

