import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

/* Reusable custom confirmation modal.
   Props:
     open: boolean
     title: string
     message: string | ReactNode
     confirmText: string (default 'Confirmar')
     cancelText: string (default 'Cancelar')
     variant: 'default' | 'danger' | 'warning'
     onConfirm: () => void
     onCancel: () => void
     busy?: boolean       disables buttons while an action is in flight
*/
export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
  busy = false,
}) {
  const cardRef = useRef(null);
  const previouslyFocused = useRef(null);

  // Lock body scroll + remember trigger for focus return.
  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [open]);

  // Focus trap + ESC handler.
  useEffect(() => {
    if (!open) return undefined;

    const card = cardRef.current;
    if (!card) return undefined;

    const focusables = card.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (last && typeof last.focus === 'function') {
      last.focus();
    }

    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!busy && typeof onCancel === 'function') onCancel();
        return;
      }
      if (e.key === 'Tab' && focusables.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  function handleOverlayMouseDown(e) {
    if (busy) return;
    if (e.target === e.currentTarget && typeof onCancel === 'function') {
      onCancel();
    }
  }

  const content = (
    <div
      className="cm-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        ref={cardRef}
        className={`cm-modal-card cm-modal-card--${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cm-modal-title"
        aria-describedby="cm-modal-desc"
      >
        <h2 id="cm-modal-title" className="cm-modal-title">{title}</h2>
        <div id="cm-modal-desc" className="cm-modal-message">
          {message}
        </div>
        <div className="cm-modal-actions">
          <button
            type="button"
            className="cm-modal-btn cm-modal-btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`cm-modal-btn cm-modal-btn--${variant === 'default' ? 'primary' : variant}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
