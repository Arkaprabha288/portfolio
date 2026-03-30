import { Code2 } from 'lucide-react'
import './SkillsSection.css'

const SKILL_COLORS = [
  '#6c63ff', '#8b5cf6', '#ec4899', '#05d6b3',
  '#f59e0b', '#3b82f6', '#10b981', '#ef4444',
]

export default function SkillsSection({ skills }) {
  if (!skills?.length) return null

  return (
    <section className="section skills-section" id="skills" aria-label="Skills">
      <div className="container">
        <div className="reveal">
          <p className="section-label"><Code2 size={13} /> Skills</p>
          <h2 className="section-title">Technical Expertise</h2>
        </div>

        <div className="skills-grid reveal" style={{ transitionDelay: '0.1s' }}>
          {skills.map((skill, i) => (
            <div
              key={skill}
              className="skill-tag"
              style={{ '--skill-color': SKILL_COLORS[i % SKILL_COLORS.length] }}
            >
              <span className="skill-dot" />
              {skill}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
