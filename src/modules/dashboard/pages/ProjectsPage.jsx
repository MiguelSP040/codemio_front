import { Link } from 'react-router-dom';
import './ProjectsPage.css';

const projects = [
  {
    id: 'auditoria-java',
    name: 'servicio-de-auditoria-estatica-java',
    description: 'Proyecto principal de analisis estatico para Java.',
    lastAnalysis: 'Ultimo analisis: hace 2 h',
  },
  {
    id: 'api-clientes',
    name: 'servicio-api-clientes-java',
    description: 'API de clientes con reglas de validacion y seguridad.',
    lastAnalysis: 'Ultimo analisis: hace 5 h',
  },
  {
    id: 'motor-reglas',
    name: 'motor-reglas-empresariales-java',
    description: 'Motor de reglas para flujos de evaluacion automatica.',
    lastAnalysis: 'Ultimo analisis: ayer',
  },
];

export default function ProjectsPage() {
  return (
    <div className="projects-page">
      <header className="projects-header">
        <p className="projects-eyebrow">Seleccion de proyecto</p>
        <h1>Proyectos disponibles</h1>
        <p>Selecciona un proyecto para abrir su dashboard y revisar archivos analizados.</p>
      </header>

      <section className="projects-grid" aria-label="Lista de proyectos">
        {projects.map((project) => (
          <article className="projects-card" key={project.id}>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            <p className="projects-analysis-time">{project.lastAnalysis}</p>
            <Link className="projects-open-btn" to={`/projects/${project.id}/dashboard`}>
              Abrir dashboard
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
