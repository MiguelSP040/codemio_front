/* Custom toast card rendered via sonner's toast.custom().
   Sonner stays the engine (stacking, enter/exit animations, swipe-to-dismiss,
   auto-dismiss timers) but the visible element is 100% our design — no more
   fighting with library defaults. */
import PropTypes from 'prop-types';

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4.5L2.8 20h18.4L12 4.5z" />
      <path d="M12 10.5v4.2" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

const ICON_FOR_TYPE = {
  success: IconCheck,
  error: IconX,
  warning: IconAlert,
  info: IconInfo,
  default: IconBell,
};

// eslint-disable-next-line react-refresh/only-export-components
export function renderCodemioToast(props) {
  return <CodemioToastCard {...props} />;
}

export default function CodemioToastCard({ type = 'default', title, description, onDismiss }) {
  const Icon = ICON_FOR_TYPE[type] ?? IconBell;
  return (
    <output className={`cm-toast cm-toast--${type}`}>
      <span className="cm-toast__accent" aria-hidden="true" />
      <span className="cm-toast__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="cm-toast__body">
        <p className="cm-toast__title">{title}</p>
        {description ? <p className="cm-toast__desc">{description}</p> : null}
      </div>
      <button
        type="button"
        className="cm-toast__close"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          // stopPropagation previene que sonner interprete el click como un
          // gesto de swipe/drag y lo cancele antes de que dispare nuestro
          // handler de dismiss.
          e.stopPropagation();
          if (typeof onDismiss === 'function') onDismiss();
        }}
        aria-label="Cerrar notificación"
      >
        <IconClose />
      </button>
    </output>
  );
}

CodemioToastCard.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'default']),
  title: PropTypes.node,
  description: PropTypes.node,
  onDismiss: PropTypes.func,
};

renderCodemioToast.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'default']),
  title: PropTypes.node,
  description: PropTypes.node,
  onDismiss: PropTypes.func,
};
