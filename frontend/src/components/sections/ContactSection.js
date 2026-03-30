import { Mail, Phone, MapPin, Github, Linkedin, Globe, Send } from 'lucide-react'
import './ContactSection.css'

export default function ContactSection({ data }) {
  const links = [
    data.email    && { icon: Mail,     label: data.email,    href: `mailto:${data.email}` },
    data.phone    && { icon: Phone,    label: data.phone,    href: `tel:${data.phone}` },
    data.linkedin && { icon: Linkedin, label: 'LinkedIn',    href: data.linkedin },
    data.github   && { icon: Github,   label: 'GitHub',      href: data.github },
    data.website  && { icon: Globe,    label: 'Website',     href: data.website },
  ].filter(Boolean)

  return (
    <section className="section contact-section" id="contact" aria-label="Contact">
      <div className="container">
        <div className="reveal">
          <p className="section-label"><Send size={13} /> Contact</p>
          <h2 className="section-title">Get In Touch</h2>
          <p className="contact-subtitle">
            Open to new opportunities and collaborations. Feel free to reach out.
          </p>
        </div>

        <div className="contact-grid reveal" style={{ transitionDelay: '0.1s' }}>
          {links.map(({ icon: Icon, label, href }) => (
            <a
              key={href}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="contact-card card"
            >
              <div className="contact-icon">
                <Icon size={20} />
              </div>
              <span className="contact-label">{label}</span>
            </a>
          ))}

          {data.location && (
            <div className="contact-card card contact-location">
              <div className="contact-icon">
                <MapPin size={20} />
              </div>
              <span className="contact-label">{data.location}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
