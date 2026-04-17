import './PageHeader.css';

export default function PageHeader({ 
  eyebrow,
  title, 
  description,
  action
}) {
  return (
    <header className="page-header">
      <div className="page-header-top">
        <div className="page-header-content">
          {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
          <h1 className="page-header-title">{title}</h1>
          {description && <p className="page-header-description">{description}</p>}
        </div>
        {action && <div className="page-header-actions">{action}</div>}
      </div>
    </header>
  );
}
