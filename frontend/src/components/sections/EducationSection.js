import { GraduationCap } from 'lucide-react'
import './EducationSection.css'

export default function EducationSection({ education }) {
  if (!education?.length) return null

  return (
    <section className="section" id="education" aria-label="Education">
      <div className="container">
        <div className="reveal">
          <p className="section-label"><GraduationCap size={13} /> Education</p>
          <h2 className="section-title">Academic Background</h2>
        </div>

        <div className="education-grid">
          {education.map((edu, i) => (
            <div
              className="edu-card card reveal"
              key={i}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="edu-icon">
                <GraduationCap size={20} />
              </div>
              <div className="edu-body">
                <h3 className="edu-degree">{edu.degree}</h3>
                {edu.school && <p className="edu-school">{edu.school}</p>}
                <div className="edu-meta">
                  {edu.period && <span className="tag accent">{edu.period}</span>}
                  {edu.gpa && <span className="tag">{edu.gpa}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
