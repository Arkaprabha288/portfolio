import { Github, Linkedin, Mail, MapPin } from 'lucide-react'
import './HeroSection.css'

export default function HeroSection({ data }) {
  const initials = data.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <section className="hero-section" aria-label="Hero">
      {/* Background gradient mesh */}
      <div className="hero-mesh" />
      <div className="hero-glow" />

      <div className="container hero-inner">
        {/* Left: text */}
        <div className="hero-content">
          <div className="hero-eyebrow anim-fade-up">
            <span className="status-dot" />
            Available for opportunities
          </div>

          <h1 className="hero-name anim-fade-up" style={{ animationDelay: '0.1s' }}>
            {data.name}
          </h1>

          <p className="hero-title-role anim-fade-up" style={{ animationDelay: '0.2s' }}>
            {data.title}
          </p>

          <p className="hero-summary anim-fade-up" style={{ animationDelay: '0.3s' }}>
            {data.summary}
          </p>

          {/* Meta */}
          <div className="hero-meta anim-fade-up" style={{ animationDelay: '0.4s' }}>
            {data.location && (
              <span className="meta-item"><MapPin size={14} /> {data.location}</span>
            )}
            {data.email && (
              <a href={`mailto:${data.email}`} className="meta-item meta-link">
                <Mail size={14} /> {data.email}
              </a>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hero-ctas anim-fade-up" style={{ animationDelay: '0.5s' }}>
            {data.email && (
              <a href={`mailto:${data.email}`} className="btn btn-primary" id="hero-contact-btn">
                <Mail size={16} /> Get in Touch
              </a>
            )}
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" id="hero-linkedin-btn">
                <Linkedin size={16} /> LinkedIn
              </a>
            )}
            {data.github && (
              <a href={data.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" id="hero-github-btn">
                <Github size={16} /> GitHub
              </a>
            )}
          </div>
        </div>

        {/* Right: avatar */}
        <div className="hero-avatar-wrap anim-fade" style={{ animationDelay: '0.3s' }}>
          {/* Orbit rings */}
          <div className="orbit-ring ring-outer">
            <div className="orbit-dot dot-1" />
          </div>
          <div className="orbit-ring ring-inner">
            <div className="orbit-dot dot-2" />
          </div>

          <div className="hero-avatar">
            <span className="avatar-initials">{initials}</span>
          </div>

          {/* Floating skill chips */}
          {data.skills.slice(0, 3).map((skill, i) => (
            <div
              key={skill}
              className="skill-chip"
              style={{
                '--chip-delay': `${i * 0.2}s`,
                '--chip-angle': `${['-30deg', '20deg', '-15deg'][i]}`,
                top:   `${['-5%', '85%', '45%'][i]}`,
                right: `${['-10%', '-12%', '-22%'][i]}`,
              }}
            >
              {skill}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a href="#experience" className="scroll-indicator" aria-label="Scroll down">
        <div className="scroll-arrow" />
      </a>
    </section>
  )
}
