import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Zap, Star, ArrowRight, CheckCircle } from 'lucide-react'
import './UploadPage.css'

const FEATURES = [
  { icon: Zap,         label: 'Instant Parsing',      desc: 'Extracts your info in seconds' },
  { icon: Star,        label: 'Beautiful Portfolio',   desc: 'Modern, premium design' },
  { icon: CheckCircle, label: 'No Sign-up Needed',     desc: '100% client-side & private' },
]

const ACCEPTED_TYPES = ['application/pdf', 'text/plain']

export default function UploadPage({ onUpload, useGemini }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateAndUpload = useCallback((file) => {
    setError('')
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.txt')) {
      setError('Please upload a PDF or TXT resume file.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be under 10 MB.')
      return
    }
    onUpload(file)
  }, [onUpload])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    validateAndUpload(file)
  }, [validateAndUpload])

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleInputChange = (e) => validateAndUpload(e.target.files[0])

  return (
    <div className="upload-page">
      {/* Animated background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="upload-container">
        {/* Header */}
        <header className="upload-header anim-fade-up">
          <div className="logo">
            <div className="logo-icon"><FileText size={22} /></div>
            <span>Portfolito</span>
          </div>
        </header>

        {/* Hero */}
        <div className="hero anim-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="hero-badge">
            <Zap size={13} />
            {useGemini ? 'Gemini AI-Powered Parser' : 'AI-Powered Portfolio Generator'}
          </div>
          <h1 className="hero-title">
            Turn Your Resume Into a
            <span className="gradient-text"> Stunning Portfolio</span>
          </h1>
          <p className="hero-subtitle">
            Upload your PDF resume and watch as we instantly transform it into a
            beautiful, professional portfolio — no coding required.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label="Upload resume file"
          style={{ animationDelay: '0.2s' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            style={{ display: 'none' }}
            onChange={handleInputChange}
            id="resume-file-input"
          />

          <div className="drop-zone-inner">
            <div className="drop-icon">
              <Upload size={32} />
            </div>
            <p className="drop-title">
              {isDragging ? 'Drop it here!' : 'Drag & drop your resume'}
            </p>
            <p className="drop-sub">or <span className="drop-link">browse files</span></p>
            <p className="drop-hint">Supports PDF · TXT &nbsp;·&nbsp; Max 10 MB</p>
          </div>

          {isDragging && <div className="drop-overlay" />}
        </div>

        {error && (
          <p className="upload-error anim-fade">
            ⚠ {error}
          </p>
        )}

        {/* CTA button */}
        <div className="upload-cta anim-fade-up" style={{ animationDelay: '0.3s' }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => fileInputRef.current?.click()}
            id="upload-btn"
          >
            Choose Resume File
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Features */}
        <div className="features anim-fade-up" style={{ animationDelay: '0.4s' }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div className="feature-card" key={label}>
              <div className="feature-icon"><Icon size={18} /></div>
              <div>
                <p className="feature-label">{label}</p>
                <p className="feature-desc">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
