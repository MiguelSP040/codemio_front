import { useEffect, useRef, useState } from 'react';
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
  const [mounted, setMounted] = useState(open);

  // Mount immediately on open; unmount is driven by onAnimationEnd (see below).
  if (open && !mounted) {
    setMounted(true);
  }

  const closing = !open && mounted;

  // Lock body scroll while visible
  useEffect(() => {
    if (!mounted) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  // Focus management + Escape / focus trap (only while fully open)
  useEffect(() => {
    if (!open || !mounted) return undefined;

    previouslyFocused.current = document.activeElement;

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
  }, [open, mounted, busy, onCancel]);

  if (!mounted) return null;

  function handleOverlayMouseDown(e) {
    if (busy) return;
    if (e.target === e.currentTarget && typeof onCancel === 'function') {
      onCancel();
    }
  }

  function handleOverlayAnimationEnd() {
    if (closing) {
      setMounted(false);
      const prev = previouslyFocused.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    }
  }

  const content = (
    <div
      className={`cm-modal-overlay${closing ? ' cm-modal-overlay--closing' : ''}`}
      onMouseDown={handleOverlayMouseDown}
      onAnimationEnd={handleOverlayAnimationEnd}
      role="presentation"
    >
      <div
        ref={cardRef}
        className={`cm-modal-card cm-modal-card--${variant}${closing ? ' cm-modal-card--closing' : ''}`}
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
