import './LoadingState.css';

export default function LoadingState({
  variant = 'spinner',
  label = 'Cargando...',
  count = 3,
  inline = false,
  className = '',
}) {
  if (variant === 'skeleton') {
    return (
      <div
        className={`cm-skeleton-list ${className}`.trim()}
        role="status"
        aria-live="polite"
      >
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="cm-skeleton-card" aria-hidden="true" />
        ))}
        <span className="cm-sr-only">{label}</span>
      </div>
    );
  }

  const wrapClass = [
    'cm-spinner-wrap',
    inline ? 'cm-spinner-wrap--inline' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapClass} role="status" aria-live="polite">
      <span className="cm-spinner" aria-hidden="true" />
      <span className="cm-spinner-label">{label}</span>
    </div>
  );
}
