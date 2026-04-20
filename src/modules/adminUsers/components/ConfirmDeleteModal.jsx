import PropTypes from 'prop-types';
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
    <div className="admin-users-modal-portal">
      <button
        type="button"
        className="admin-users-modal-backdrop"
        onClick={onCancel}
        disabled={loading}
        aria-label="Cerrar diálogo"
        tabIndex={-1}
      />
      <div className="admin-users-modal" role="dialog" aria-modal="true">{/* NOSONAR */}
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

ConfirmDeleteModal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  loading: PropTypes.bool,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

