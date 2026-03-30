import { Layers, ExternalLink } from 'lucide-react'
import './ProjectsSection.css'

export default function ProjectsSection({ projects }) {
  if (!projects?.length) return null

  return (
    <section className="section" id="projects" aria-label="Projects">
      <div className="container">
        <div className="reveal">
          <p className="section-label"><Layers size={13} /> Projects</p>
          <h2 className="section-title">Featured Work</h2>
        </div>

        <div className="projects-grid">
          {projects.map((project, i) => (
            <div
              className="project-card card reveal"
              key={i}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="project-header">
                <div className="project-icon">
                  <Layers size={18} />
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link-btn"
                    aria-label={`View ${project.name}`}
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>

              <h3 className="project-name">{project.name}</h3>

              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}

              {project.bullets?.length > 0 && (
                <ul className="project-bullets">
                  {project.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}

              {project.tech?.length > 0 && (
                <div className="project-tech">
                  {project.tech.map(t => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
