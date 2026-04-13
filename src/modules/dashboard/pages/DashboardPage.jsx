import { useState } from 'react';
import AnalysisStatusCard from '../components/AnalysisStatusCard';
import './DashboardPage.css';

const projectSummary = {
  name: 'servicio-de-auditoria-estatica-java',
  status: 'Último análisis: hace 2 h',
  score: 84,
};

const summaryCards = [
  { label: 'Problemas críticos', value: 2 },
  { label: 'Advertencias', value: 11 },
  { label: 'Reglas aprobadas', value: 47 },
  { label: 'Sugerencias', value: 9 },
];

const findings = [
  {
    severity: 'Crítico',
    file: 'src/main/java/com/codemio/AuthService.java',
    rule: 'Posible NullPointerException',
    recommendation: 'Agrega una validación nula antes de usar el resultado de userRepository.findByEmail.',
  },
  {
    severity: 'Advertencia',
    file: 'src/main/java/com/codemio/ReportController.java',
    rule: 'Método demasiado largo',
    recommendation: 'Divide el método en funciones más pequeñas según su responsabilidad.',
  },
  {
    severity: 'Informativo',
    file: 'src/main/java/com/codemio/CodeScanner.java',
    rule: 'Buen manejo de excepciones',
    recommendation: 'Mantén la estrategia actual de try-catch y registra más contexto.',
  },
];

function severityClass(severity) {
  if (severity === 'Crítico') return 'dashboard-badge dashboard-badge--critical';
  if (severity === 'Advertencia') return 'dashboard-badge dashboard-badge--warning';
  return 'dashboard-badge dashboard-badge--info';
}

export default function DashboardPage() {
  const analysisStatus = 'completed';
  const lastUpdated = '12/04/2026 10:45';

  const [projectName, setProjectName] = useState(projectSummary.name);
  const [draftName, setDraftName] = useState(projectSummary.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameError, setNameError] = useState('');

  function startEditName() {
    setDraftName(projectName);
    setNameError('');
    setIsEditingName(true);
  }

  function cancelEditName() {
    setDraftName(projectName);
    setNameError('');
    setIsEditingName(false);
  }

  function saveProjectName() {
    const normalizedName = draftName.trim();

    if (!normalizedName) {
      setNameError('El nombre del proyecto no puede estar vacío.');
      return;
    }

    setProjectName(normalizedName);
    setNameError('');
    setIsEditingName(false);
  }

  function handleNameKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveProjectName();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditName();
    }
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Resumen del repositorio</p>
          {!isEditingName ? (
            <div className="dashboard-title-row">
              <h1>{projectName}</h1>
              <button
                type="button"
                className="dashboard-btn dashboard-btn--ghost"
                onClick={startEditName}
                aria-label="Editar nombre del proyecto"
              >
                Editar nombre
              </button>
            </div>
          ) : (
            <div className="dashboard-name-editor">
              <label htmlFor="project-name" className="dashboard-name-label">
                Nombre del proyecto
              </label>
              <div className="dashboard-name-controls">
                <input
                  id="project-name"
                  className="dashboard-name-input"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                />
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn--primary"
                  onClick={saveProjectName}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="dashboard-btn dashboard-btn--ghost"
                  onClick={cancelEditName}
                >
                  Cancelar
                </button>
              </div>
              {nameError && <p className="dashboard-name-error">{nameError}</p>}
            </div>
          )}
          <p className="dashboard-subtitle">{projectSummary.status}</p>
        </div>
        <div className="dashboard-score-card">
          <span className="dashboard-score-label">Puntaje de calidad</span>
          <strong className="dashboard-score-value">{projectSummary.score}</strong>
        </div>
      </section>

      {/* Example usage: replace these mock props with backend data in a next step. */}
      <AnalysisStatusCard analysisStatus={analysisStatus} lastUpdated={lastUpdated} />

      <section className="dashboard-summary-grid" aria-label="Métricas resumen del proyecto">
        {summaryCards.map((item) => (
          <article className="dashboard-summary-card" key={item.label}>
            <p className="dashboard-summary-label">{item.label}</p>
            <p className="dashboard-summary-value">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-findings" aria-label="Hallazgos del análisis">
        <header className="dashboard-section-header">
          <h2>Hallazgos</h2>
          <p>Resultados automáticos del análisis estático para el último escaneo.</p>
        </header>

        <div className="dashboard-findings-table-wrap">
          <table className="dashboard-findings-table">
            <thead>
              <tr>
                <th>Severidad</th>
                <th>Archivo</th>
                <th>Regla</th>
                <th>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding, index) => (
                <tr key={`${finding.file}-${index}`}>
                  <td>
                    <span className={severityClass(finding.severity)}>{finding.severity}</span>
                  </td>
                  <td>{finding.file}</td>
                  <td>{finding.rule}</td>
                  <td>{finding.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
