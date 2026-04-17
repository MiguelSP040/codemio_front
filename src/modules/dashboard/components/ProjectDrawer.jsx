function sidebarLabel(fileName) {
  return fileName.replace('.java', '');
}

export default function ProjectDrawer({
  isOpen,
  onToggle,
  onClose,
  analysisFiles,
  selectedFileId,
  onSelectFile,
  getStatusClass,
  getStatusLabel,
}) {
  return (
    <>
      <button
        type="button"
        className="dashboard-drawer-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Cerrar menu de proyectos' : 'Abrir menu de proyectos'}
        aria-expanded={isOpen}
      >
        {isOpen ? '<' : '>'}
      </button>

      {isOpen && <div className="dashboard-drawer-backdrop" onClick={onClose} />}

      <aside className={`dashboard-sidebar${isOpen ? ' dashboard-sidebar--open' : ' dashboard-sidebar--closed'}`}>
        <div className="dashboard-sidebar-header">
          <div>
            <p className="dashboard-eyebrow">Proyectos</p>
            <h2>Selecciona un archivo</h2>
          </div>
        </div>

        <p className="dashboard-sidebar-caption">
          Selecciona un proyecto para ver su analisis detallado.
        </p>

        <div className="dashboard-sidebar-list">
          {analysisFiles.map((analysis) => {
            const isSelected = analysis.id === selectedFileId;
            const label = sidebarLabel(analysis.fileName);

            return (
              <button
                key={analysis.id}
                type="button"
                className={`dashboard-sidebar-item${isSelected ? ' dashboard-sidebar-item--active' : ''}`}
                onClick={() => onSelectFile(analysis.id)}
                aria-pressed={isSelected}
              >
                <div className="dashboard-sidebar-item-top">
                  <span className="dashboard-sidebar-item-name">{label}</span>
                  <span className={`analysis-status-badge ${getStatusClass(analysis.analysisStatus)}`}>
                    {getStatusLabel(analysis.analysisStatus)}
                  </span>
                </div>

                <p className="dashboard-sidebar-item-path">{analysis.filePath}</p>

                <div className="dashboard-sidebar-item-meta">
                  <p className="dashboard-sidebar-item-description">{analysis.shortDescription}</p>
                  <div className="dashboard-sidebar-item-stats">
                    <span className="dashboard-sidebar-item-stat">Score {analysis.score}</span>
                    <span className="dashboard-sidebar-item-stat">
                      {analysis.summaryCards[0].value} criticos
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
