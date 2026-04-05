import { useState, useEffect } from 'react'
import UploadPage from './components/UploadPage'
import LoadingScreen from './components/LoadingScreen'
import PortfolioPage from './components/PortfolioPage'
import { extractTextFromPDF } from './utils/pdfExtractor'
import { parseResumeWithBedrock } from './utils/bedrockParser'
import { parseResume } from './utils/mockParser'
import { logger, downloadExtractedData } from './utils/logger'
import { heuristicCheck } from './utils/resumeValidator'
import { savePortfolio, fetchPortfolio } from './utils/portfolioService'

const VIEWS = { upload: 'upload', loading: 'loading', portfolio: 'portfolio', error: 'error' }

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'

export default function App() {
  const [view, setView]                   = useState(VIEWS.upload)
  const [portfolioData, setPortfolioData] = useState(null)
  const [loadingMsg, setLoadingMsg]       = useState('')
  const [fileName, setFileName]           = useState('')
  const [errorMsg, setErrorMsg]           = useState('')
  const [rawText, setRawText]             = useState('')
  const [portfolioUUID, setPortfolioUUID] = useState(null)

  // NEW: Bedrock AI analysis state
  const [aiAnalysis, setAiAnalysis]       = useState(null)
  const [aiLoading, setAiLoading]         = useState(false)
  const [aiError, setAiError]             = useState('')
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

  // On mount — check if URL is /portfolio/<uuid>
  useEffect(() => {
    const match = window.location.pathname.match(/^\/portfolio\/([a-f0-9-]{36})$/)
    if (match) {
      loadPortfolioByUUID(match[1])
    }

    const handlePopState = () => {
      if (window.location.pathname === '/') {
        setView(VIEWS.upload)
        setPortfolioData(null)
        setPortfolioUUID(null)
        setRawText('')
        setErrorMsg('')
        setAiAnalysis(null)
        setAiError('')
        logger.clear()
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const loadPortfolioByUUID = async (uuid) => {
    setView(VIEWS.loading)
    setLoadingMsg('Loading shared portfolio...')
    try {
      window.history.replaceState(null, '', '/')
      window.history.pushState(null, '', `/portfolio/${uuid}`)

      const data = await fetchPortfolio(uuid)
      setPortfolioData(data)
      setPortfolioUUID(uuid)
      setView(VIEWS.portfolio)
    } catch (err) {
      setErrorMsg(`Could not load portfolio.\n\n${err.message}`)
      setView(VIEWS.error)
    }
  }

  const startRateLimitCountdown = () => {
    setRateLimitCountdown(20)
    const interval = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // NEW: Call backend → Bedrock to analyze the saved portfolio
  const handleBedrockAnalyze = async () => {
    if (!portfolioUUID) return

    setAiLoading(true)
    setAiError('')
    setAiAnalysis(null)

    try {
      const res = await fetch(`${API_URL}/api/portfolio/${portfolioUUID}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Analysis failed.')
      }

      setAiAnalysis(json.analysis)
    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        setAiError('⚠️ Too many requests. Please wait 20 seconds before trying again.')
        startRateLimitCountdown()
      } else {
        setAiError(err.message || 'Could not reach analysis service.')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    logger.clear()
    setFileName(file.name)
    setErrorMsg('')
    setRawText('')
    setAiAnalysis(null)
    setAiError('')
    setView(VIEWS.loading)

    try {
      // ── Step 1: Extract text ──────────────────────────────────
      setLoadingMsg('Extracting text from resume...')
      logger.log('File received', { name: file.name, size: file.size, type: file.type })

      let text = ''
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file)
      } else {
        text = await file.text()
      }

      logger.log('Text extraction complete', { charCount: text.length, preview: text.slice(0, 300) })
      setRawText(text)

      if (!text || text.trim().length < 30) {
        throw new Error(
          'Could not extract text from this PDF.\n\nThis usually means the PDF is a scanned image. Please use a text-based PDF (one where you can select/copy text).'
        )
      }

      // ── Step 2: Validate it's a resume ────────────────────────
      setLoadingMsg('Validating document...')
      logger.log('Running heuristic validation...')
      const heuristic = heuristicCheck(text)
      if (!heuristic.valid) throw new Error(heuristic.reason)
      logger.log('Heuristic check passed')

      // ── Step 3: Parse via Bedrock ─────────────────────────────
      setLoadingMsg('Analyzing with AWS Bedrock AI...')
      logger.log('Sending to Bedrock API...')
      let data
      try {
        data = await parseResumeWithBedrock(text)
        logger.log('Bedrock response received', data)
      } catch (bedrockErr) {
        if (bedrockErr.message === 'RATE_LIMITED') {
          startRateLimitCountdown()
          throw new Error('⚠️ Too many requests from your IP. Please wait 20 seconds and try again.')
        }
        logger.warn('Bedrock failed, falling back to mock parser:', bedrockErr.message)
        setLoadingMsg('Parsing resume...')
        await new Promise(r => setTimeout(r, 600))
        data = parseResume(text)
        logger.log('Mock parser result', data)
      }

      if (!data || !data.name) {
        throw new Error('Parser returned invalid data — name field is missing.')
      }

      // ── Step 4: Save to MongoDB & get UUID ────────────────────
      setLoadingMsg('Saving your portfolio...')
      logger.log('Saving to MongoDB...')
      const uuid = await savePortfolio(data)
      logger.log('Portfolio saved', { uuid })

      window.history.pushState(null, '', `/portfolio/${uuid}`)

      setPortfolioUUID(uuid)
      setPortfolioData(data)
      setLoadingMsg('Building your portfolio...')
      await new Promise(r => setTimeout(r, 400))
      setView(VIEWS.portfolio)

    } catch (err) {
      logger.error('Fatal error', { message: err.message })
      setErrorMsg(err.message || 'Something went wrong.')
      setView(VIEWS.error)
    }
  }

  const handleReset = () => {
    setView(VIEWS.upload)
    setPortfolioData(null)
    setFileName('')
    setErrorMsg('')
    setRawText('')
    setPortfolioUUID(null)
    setAiAnalysis(null)
    setAiError('')
    window.history.pushState(null, '', '/')
    logger.clear()
  }

  const shareableURL = portfolioUUID
    ? `${window.location.origin}/portfolio/${portfolioUUID}`
    : null

  if (view === VIEWS.error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--clr-bg)', padding: '2rem', flexDirection: 'column', gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
          borderRadius: '16px', padding: '2rem', maxWidth: '520px', width: '100%'
        }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</p>
          <h2 style={{ color: '#ff6b6b', marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
            Something went wrong
          </h2>
          <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
            {errorMsg}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleReset}>Try Again</button>
      </div>
    )
  }

  return (
    <>
      {view === VIEWS.upload && (
        <UploadPage onUpload={handleFileUpload} />
      )}
      {view === VIEWS.loading && (
        <LoadingScreen message={loadingMsg} fileName={fileName} />
      )}
      {view === VIEWS.portfolio && portfolioData && (
        <>
          <PortfolioPage
            data={portfolioData}
            rawText={rawText}
            shareableURL={shareableURL}
            onReset={handleReset}
            onDownload={() => downloadExtractedData(rawText, portfolioData)}
          />

          {/* ── Bedrock AI Analysis Panel ── */}
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 4rem',
            padding: '0 1.5rem',
          }}>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                    AI Career Analysis
                  </h3>
                  <p style={{ color: 'var(--clr-text-2)', fontSize: '0.8rem' }}>
                    Powered by Amazon Bedrock · Nova Micro
                  </p>
                </div>
              </div>

              {!aiAnalysis && !aiLoading && (
                <>
                  <p style={{ color: 'var(--clr-text-2)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                    Get a professional summary, your top strengths, and a skill gap suggestion — generated by AWS Bedrock AI.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={handleBedrockAnalyze}
                    disabled={!portfolioUUID || rateLimitCountdown > 0}
                  >
                    {rateLimitCountdown > 0 ? `Wait ${rateLimitCountdown}s` : '✨ Analyze My Portfolio'}
                  </button>
                </>
              )}

              {aiLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--clr-text-2)', fontSize: '0.9rem' }}>
                  <div style={{
                    width: '18px', height: '18px', border: '2px solid var(--clr-primary)',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', flexShrink: 0
                  }} />
                  Asking Bedrock AI...
                </div>
              )}

              {aiError && (
                <div style={{
                  background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
                  borderRadius: '10px', padding: '1rem', fontSize: '0.85rem', color: '#ff6b6b',
                  marginBottom: '1rem'
                }}>
                  {aiError}
                  {rateLimitCountdown > 0 && (
                    <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                      Retry in {rateLimitCountdown}s...
                    </div>
                  )}
                </div>
              )}

              {aiAnalysis && (
                <div style={{
                  background: 'var(--clr-surface-2)', borderRadius: '12px',
                  padding: '1.25rem', lineHeight: 1.8,
                  color: 'var(--clr-text)', fontSize: '0.9rem',
                  whiteSpace: 'pre-wrap',
                  borderLeft: '3px solid var(--clr-primary)'
                }}>
                  {aiAnalysis}
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      onClick={handleBedrockAnalyze}
                    >
                      🔄 Re-analyze
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}