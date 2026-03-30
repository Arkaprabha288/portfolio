import { Briefcase } from 'lucide-react'
import './ExperienceSection.css'

export default function ExperienceSection({ experience }) {
  if (!experience?.length) return null

  return (
    <section className="section" id="experience" aria-label="Experience">
      <div className="container">
        <div className="reveal">
          <p className="section-label"><Briefcase size={13} /> Experience</p>
          <h2 className="section-title">Work History</h2>
        </div>

        <div className="timeline">
          {experience.map((job, i) => (
            <div className="timeline-item reveal" key={i} style={{ transitionDelay: `${i * 0.12}s` }}>
              {/* Line + dot */}
              <div className="timeline-track">
                <div className="timeline-dot" />
                {i < experience.length - 1 && <div className="timeline-line" />}
              </div>

              {/* Card */}
              <div className="timeline-card card">
                <div className="timeline-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-company">{job.company}</p>
                  </div>
                  {job.period && (
                    <span className="job-period tag accent">{job.period}</span>
                  )}
                </div>

                {job.bullets?.length > 0 && (
                  <ul className="job-bullets">
                    {job.bullets.map((b, bi) => (
                      <li key={bi} className="job-bullet">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
