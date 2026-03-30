import { useEffect, useState } from 'react'
import { RefreshCw, Download, Share2, Copy, Check, Linkedin, Twitter, Facebook, Home } from 'lucide-react'
import HeroSection from './sections/HeroSection'
import ExperienceSection from './sections/ExperienceSection'
import SkillsSection from './sections/SkillsSection'
import EducationSection from './sections/EducationSection'
import ProjectsSection from './sections/ProjectsSection'
import ContactSection from './sections/ContactSection'
import './PortfolioPage.css'

function SharePanel({ url, name }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const encoded = encodeURIComponent(url)
  const text    = encodeURIComponent(`Check out ${name}'s portfolio!`)

  const platforms = [
    { label: 'LinkedIn',  icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: 'Twitter',   icon: Twitter,  href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}` },
    { label: 'Facebook',  icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: 'WhatsApp',  icon: Share2,   href: `https://wa.me/?text=${text}%20${encoded}` },
  ]

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="share-wrapper">
      <button className="btn btn-primary btn-sm" onClick={() => setOpen(o => !o)}>
        <Share2 size={14} /> Share
      </button>

      {open && (
        <div className="share-panel glass-2">
          <p className="share-title">Share this portfolio</p>

          {/* Copy link row */}
          <div className="share-link-row">
            <span className="share-url">{url}</span>
            <button className="btn btn-ghost btn-sm share-copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Social buttons */}
          <div className="share-socials">
            {platforms.map(({ label, icon: Icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="share-social-btn"
              >
                <Icon size={15} />
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PortfolioPage({ data, onReset, onDownload, shareableURL }) {
  // true when viewing someone else's shared portfolio (no upload controls)
  const isSharedView = !onDownload && !onReset
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="portfolio-page">
      <nav className="portfolio-nav glass">
        <div className="nav-inner container">
          <div className="nav-logo">
            <span className="gradient-text">{data.name.split(' ')[0]}</span>
          </div>
          <div className="nav-links">
            <a href="#experience" className="nav-link">Experience</a>
            <a href="#skills"     className="nav-link">Skills</a>
            <a href="#projects"   className="nav-link">Projects</a>
            <a href="#education"  className="nav-link">Education</a>
            <a href="#contact"    className="nav-link">Contact</a>
          </div>
          <div className="nav-actions">
            {shareableURL && (
              <SharePanel url={shareableURL} name={data.name} />
            )}
            {onDownload && (
              <button className="btn btn-ghost btn-sm" onClick={onDownload} title="Export JSON">
                <Download size={14} /> Export
              </button>
            )}
            {onReset && (
              <button className="btn btn-ghost btn-sm" onClick={onReset}>
                <RefreshCw size={14} /> Rebuild
              </button>
            )}
            {isSharedView && (
              <a href="/" className="btn btn-primary btn-sm">
                <Home size={14} /> Create Yours
              </a>
            )}
          </div>
        </div>
      </nav>

      <HeroSection data={data} />
      <ExperienceSection experience={data.experience} />
      <SkillsSection skills={data.skills} />
      <ProjectsSection projects={data.projects} />
      <EducationSection education={data.education} />
      <ContactSection data={data} />

      <footer className="portfolio-footer">
        <div className="container">
          <p className="footer-text">
            Built with <span className="gradient-text">Portfolito</span> — Upload your resume, get your portfolio.
          </p>
          {isSharedView ? (
            <a href="/" className="btn btn-primary btn-sm">
              <Home size={13} /> Create Your Own Portfolio
            </a>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={onReset}>
              <RefreshCw size={13} /> Upload a new resume
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
