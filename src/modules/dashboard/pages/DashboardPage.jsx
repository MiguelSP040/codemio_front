import { useState } from 'react';
import AnalysisStatusCard from '../components/AnalysisStatusCard';
import './DashboardPage.css';

const analysisFiles = [
  {
    id: 'auth-service',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'AuthService.java',
    filePath: 'src/main/java/com/codemio/AuthService.java',
    shortDescription: 'Archivo con foco en validaciones de usuario y riesgos de null handling.',
    score: 84,
    analysisStatus: 'completed',
    lastUpdated: '12/04/2026 10:45',
    summaryCards: [
      { label: 'Problemas críticos', value: 2 },
      { label: 'Advertencias', value: 11 },
      { label: 'Reglas aprobadas', value: 47 },
      { label: 'Sugerencias', value: 9 },
    ],
    findings: [
      {
        severity: 'Crítico',
        file: 'src/main/java/com/codemio/AuthService.java',
        rule: 'Posible NullPointerException',
        recommendation: 'Agrega una validación nula antes de usar el resultado de userRepository.findByEmail.',
      },
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/AuthService.java',
        rule: 'Validación duplicada',
        recommendation: 'Consolida las validaciones repetidas para reducir ruido y mejorar mantenibilidad.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/AuthService.java',
        rule: 'Buen manejo de excepciones',
        recommendation: 'Mantén la estrategia actual de try-catch y registra más contexto.',
      },
    ],
  },
  {
    id: 'report-controller',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'ReportController.java',
    filePath: 'src/main/java/com/codemio/ReportController.java',
    shortDescription: 'Controlador con más advertencias por tamaño y responsabilidad mezclada.',
    score: 76,
    analysisStatus: 'processing',
    lastUpdated: '12/04/2026 10:18',
    summaryCards: [
      { label: 'Problemas críticos', value: 1 },
      { label: 'Advertencias', value: 8 },
      { label: 'Reglas aprobadas', value: 39 },
      { label: 'Sugerencias', value: 6 },
    ],
    findings: [
      {
        severity: 'Crítico',
        file: 'src/main/java/com/codemio/ReportController.java',
        rule: 'Método demasiado largo',
        recommendation: 'Divide el método en funciones más pequeñas según su responsabilidad.',
      },
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/ReportController.java',
        rule: 'Complejidad ciclomática alta',
        recommendation: 'Extrae bloques condicionales a funciones auxiliares para simplificar el flujo.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/ReportController.java',
        rule: 'Buena documentación',
        recommendation: 'Mantén los comentarios actuales para facilitar el mantenimiento.',
      },
    ],
  },
  {
    id: 'codescanner',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'CodeScanner.java',
    filePath: 'src/main/java/com/codemio/CodeScanner.java',
    shortDescription: 'Archivo con mayor estabilidad y menor densidad de hallazgos.',
    score: 91,
    analysisStatus: 'completed',
    lastUpdated: '12/04/2026 09:52',
    summaryCards: [
      { label: 'Problemas críticos', value: 0 },
      { label: 'Advertencias', value: 3 },
      { label: 'Reglas aprobadas', value: 60 },
      { label: 'Sugerencias', value: 2 },
    ],
    findings: [
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/CodeScanner.java',
        rule: 'Buen manejo de excepciones',
        recommendation: 'Mantén la estrategia actual de try-catch y registra más contexto.',
      },
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/CodeScanner.java',
        rule: 'Nombre de variable poco descriptivo',
        recommendation: 'Usa nombres más específicos para mejorar la lectura del flujo.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/CodeScanner.java',
        rule: 'Cobertura aceptable',
        recommendation: 'El archivo se mantiene estable y listo para integrarse con el backend.',
      },
    ],
  },
  {
    id: 'project-service',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'ProjectService.java',
    filePath: 'src/main/java/com/codemio/ProjectService.java',
    shortDescription: 'Servicio de proyectos con deuda técnica moderada en validaciones de entrada.',
    score: 79,
    analysisStatus: 'queued',
    lastUpdated: '12/04/2026 09:38',
    summaryCards: [
      { label: 'Problemas críticos', value: 1 },
      { label: 'Advertencias', value: 6 },
      { label: 'Reglas aprobadas', value: 45 },
      { label: 'Sugerencias', value: 7 },
    ],
    findings: [
      {
        severity: 'Crítico',
        file: 'src/main/java/com/codemio/ProjectService.java',
        rule: 'Posible acceso nulo',
        recommendation: 'Valida objetos de entrada antes de invocar métodos encadenados.',
      },
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/ProjectService.java',
        rule: 'Método con demasiados parámetros',
        recommendation: 'Agrupa parámetros en un DTO para reducir complejidad.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/ProjectService.java',
        rule: 'Buen uso de transacciones',
        recommendation: 'Mantén la delimitación actual de transacciones por caso de uso.',
      },
    ],
  },
  {
    id: 'analysis-runner',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'AnalysisRunner.java',
    filePath: 'src/main/java/com/codemio/AnalysisRunner.java',
    shortDescription: 'Orquestador de ejecución con oportunidades de simplificación del flujo.',
    score: 73,
    analysisStatus: 'processing',
    lastUpdated: '12/04/2026 09:31',
    summaryCards: [
      { label: 'Problemas críticos', value: 2 },
      { label: 'Advertencias', value: 9 },
      { label: 'Reglas aprobadas', value: 34 },
      { label: 'Sugerencias', value: 8 },
    ],
    findings: [
      {
        severity: 'Crítico',
        file: 'src/main/java/com/codemio/AnalysisRunner.java',
        rule: 'Bloque catch demasiado genérico',
        recommendation: 'Captura excepciones específicas para mejorar el diagnóstico.',
      },
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/AnalysisRunner.java',
        rule: 'Complejidad ciclomática alta',
        recommendation: 'Divide el flujo por etapas de análisis para facilitar pruebas.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/AnalysisRunner.java',
        rule: 'Métricas consistentes',
        recommendation: 'Conserva la estructura de métricas actual para comparaciones históricas.',
      },
    ],
  },
  {
    id: 'rules-engine',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'RulesEngine.java',
    filePath: 'src/main/java/com/codemio/RulesEngine.java',
    shortDescription: 'Motor de reglas con buena cobertura y algunos puntos de optimización.',
    score: 88,
    analysisStatus: 'completed',
    lastUpdated: '12/04/2026 09:20',
    summaryCards: [
      { label: 'Problemas críticos', value: 0 },
      { label: 'Advertencias', value: 4 },
      { label: 'Reglas aprobadas', value: 58 },
      { label: 'Sugerencias', value: 3 },
    ],
    findings: [
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/RulesEngine.java',
        rule: 'Duplicación de lógica de validación',
        recommendation: 'Extrae utilidades comunes para minimizar repetición.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/RulesEngine.java',
        rule: 'Cobertura de reglas alta',
        recommendation: 'Mantén la trazabilidad por regla para debugging rápido.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/RulesEngine.java',
        rule: 'Diseño extensible',
        recommendation: 'La arquitectura permite añadir reglas sin acoplamiento fuerte.',
      },
    ],
  },
  {
    id: 'scan-report-mapper',
    repositoryName: 'servicio-de-auditoria-estatica-java',
    fileName: 'ScanReportMapper.java',
    filePath: 'src/main/java/com/codemio/ScanReportMapper.java',
    shortDescription: 'Mapeador de resultados con hallazgos bajos y comportamiento estable.',
    score: 93,
    analysisStatus: 'completed',
    lastUpdated: '12/04/2026 09:12',
    summaryCards: [
      { label: 'Problemas críticos', value: 0 },
      { label: 'Advertencias', value: 2 },
      { label: 'Reglas aprobadas', value: 64 },
      { label: 'Sugerencias', value: 1 },
    ],
    findings: [
      {
        severity: 'Advertencia',
        file: 'src/main/java/com/codemio/ScanReportMapper.java',
        rule: 'Conversión repetida',
        recommendation: 'Centraliza conversiones en un helper reutilizable.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/ScanReportMapper.java',
        rule: 'Nombres de método claros',
        recommendation: 'Mantén convención de nombres actual.',
      },
      {
        severity: 'Informativo',
        file: 'src/main/java/com/codemio/ScanReportMapper.java',
        rule: 'Baja deuda técnica',
        recommendation: 'Archivo listo para pasar a integración con datos reales.',
      },
    ],
  },
];

function severityClass(severity) {
  if (severity === 'Crítico') return 'dashboard-badge dashboard-badge--critical';
  if (severity === 'Advertencia') return 'dashboard-badge dashboard-badge--warning';
  return 'dashboard-badge dashboard-badge--info';
}

function analysisStatusClass(analysisStatus) {
  if (analysisStatus === 'queued') return 'analysis-status-badge--queued';
  if (analysisStatus === 'processing') return 'analysis-status-badge--processing';
  if (analysisStatus === 'completed') return 'analysis-status-badge--completed';
  if (analysisStatus === 'error') return 'analysis-status-badge--error';
  return 'analysis-status-badge--idle';
}

function analysisStatusLabel(analysisStatus) {
  if (analysisStatus === 'queued') return 'En cola';
  if (analysisStatus === 'processing') return 'En proceso';
  if (analysisStatus === 'completed') return 'Completado';
  if (analysisStatus === 'error') return 'Error';
  return 'Sin iniciar';
}

export default function DashboardPage() {
  const [selectedFileId, setSelectedFileId] = useState(analysisFiles[0].id);
  const selectedAnalysis =
    analysisFiles.find((analysis) => analysis.id === selectedFileId) ?? analysisFiles[0];

  return (
    <div className="dashboard-page">
      <section className="dashboard-files-section">
        <header className="dashboard-section-header">
          <p className="dashboard-eyebrow">Análisis detallado por archivo</p>
          <h2>Archivos disponibles</h2>
          <p>Selecciona una card para mostrar el dashboard detallado de ese archivo.</p>
        </header>

        <div className="dashboard-files-grid">
          {analysisFiles.map((analysis) => {
            const isSelected = analysis.id === selectedFileId;

            return (
              <button
                key={analysis.id}
                type="button"
                className={`dashboard-file-card${isSelected ? ' dashboard-file-card--active' : ''}`}
                onClick={() => setSelectedFileId(analysis.id)}
                aria-pressed={isSelected}
              >
                <div className="dashboard-file-card-top">
                  <span className="dashboard-file-name">{analysis.fileName}</span>
                  <span
                    className={`analysis-status-badge ${analysisStatusClass(analysis.analysisStatus)}`}
                  >
                    {analysisStatusLabel(analysis.analysisStatus)}
                  </span>
                </div>
                <p className="dashboard-file-path">{analysis.filePath}</p>
                <p className="dashboard-file-description">{analysis.shortDescription}</p>
                <div className="dashboard-file-stats">
                  <span className="dashboard-file-stat">Score {analysis.score}</span>
                  <span className="dashboard-file-stat">
                    {analysis.summaryCards[0].value} críticos
                  </span>
                  <span className="dashboard-file-stat">
                    {analysis.summaryCards[1].value} advertencias
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Repositorio {selectedAnalysis.repositoryName}</p>
          <div className="dashboard-title-row">
            <h1>{selectedAnalysis.fileName}</h1>
            <span
              className={`analysis-status-badge ${analysisStatusClass(selectedAnalysis.analysisStatus)}`}
            >
              {analysisStatusLabel(selectedAnalysis.analysisStatus)}
            </span>
          </div>
          <p className="dashboard-subtitle">{selectedAnalysis.filePath}</p>
          <p className="dashboard-detail-description">{selectedAnalysis.shortDescription}</p>
        </div>
        <div className="dashboard-score-card">
          <span className="dashboard-score-label">Score del archivo</span>
          <strong className="dashboard-score-value">{selectedAnalysis.score}</strong>
        </div>
      </section>

      <AnalysisStatusCard
        analysisStatus={selectedAnalysis.analysisStatus}
        lastUpdated={selectedAnalysis.lastUpdated}
      />

      <section className="dashboard-summary-grid" aria-label="Métricas resumen del proyecto">
        {selectedAnalysis.summaryCards.map((item) => (
          <article className="dashboard-summary-card" key={item.label}>
            <p className="dashboard-summary-label">{item.label}</p>
            <p className="dashboard-summary-value">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-findings" aria-label="Hallazgos del análisis">
        <header className="dashboard-section-header">
          <h2>Hallazgos</h2>
          <p>Resultados automáticos del análisis estático para el archivo seleccionado.</p>
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
              {selectedAnalysis.findings.map((finding, index) => (
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
