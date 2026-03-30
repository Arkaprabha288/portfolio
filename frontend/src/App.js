import { useState, useEffect } from 'react'
import UploadPage from './components/UploadPage'
import LoadingScreen from './components/LoadingScreen'
import PortfolioPage from './components/PortfolioPage'
import { extractTextFromPDF } from './utils/pdfExtractor'
import { parseResumeWithGemini } from './utils/geminiParser'
import { parseResume } from './utils/mockParser'
import { logger, downloadExtractedData } from './utils/logger'
import { heuristicCheck, geminiValidate } from './utils/resumeValidator'
import { savePortfolio, fetchPortfolio } from './utils/portfolioService'

const VIEWS = { upload: 'upload', loading: 'loading', portfolio: 'portfolio', error: 'error' }

export default function App() {
  const [view, setView]                   = useState(VIEWS.upload)
  const [portfolioData, setPortfolioData] = useState(null)
  const [loadingMsg, setLoadingMsg]       = useState('')
  const [fileName, setFileName]           = useState('')
  const [errorMsg, setErrorMsg]           = useState('')
  const [rawText, setRawText]             = useState('')
  const [portfolioUUID, setPortfolioUUID] = useState(null)

  // On mount — check if URL is /portfolio/<uuid>
  useEffect(() => {
    const match = window.location.pathname.match(/^\/portfolio\/([a-f0-9-]{36})$/)
    if (match) {
      loadPortfolioByUUID(match[1])
    }

    // Browser back button — if user navigates back to /, reset to upload page
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        setView(VIEWS.upload)
        setPortfolioData(null)
        setPortfolioUUID(null)
        setRawText('')
        setErrorMsg('')
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
      // Push home into history first so browser back button works
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

  const handleFileUpload = async (file) => {
    logger.clear()
    setFileName(file.name)
    setErrorMsg('')
    setRawText('')
    setView(VIEWS.loading)

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY
      const hasKey = apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here'

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

      if (hasKey) {
        logger.log('Running Gemini document validation...')
        const geminiCheck = await geminiValidate(text, apiKey)
        if (!geminiCheck.valid) throw new Error(geminiCheck.reason)
        logger.log('Gemini validation passed — confirmed resume')
      }

      // ── Step 3: Parse ─────────────────────────────────────────
      let data
      if (hasKey) {
        setLoadingMsg('Analyzing with Gemini AI...')
        logger.log('Sending to Gemini API...')
        data = await parseResumeWithGemini(text)
        logger.log('Gemini response received', data)
      } else {
        setLoadingMsg('Parsing resume...')
        logger.warn('No Gemini API key — using mock parser')
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

      // Update browser URL to the shareable link
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
    window.history.pushState(null, '', '/')
    logger.clear()
  }

  const hasGemini = Boolean(
    process.env.REACT_APP_GEMINI_API_KEY &&
    process.env.REACT_APP_GEMINI_API_KEY !== 'your_gemini_api_key_here'
  )

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
        <UploadPage onUpload={handleFileUpload} useGemini={hasGemini} />
      )}
      {view === VIEWS.loading && (
        <LoadingScreen message={loadingMsg} fileName={fileName} />
      )}
      {view === VIEWS.portfolio && portfolioData && (
        <PortfolioPage
          data={portfolioData}
          rawText={rawText}
          shareableURL={shareableURL}
          onReset={handleReset}
          onDownload={() => downloadExtractedData(rawText, portfolioData)}
        />
      )}
    </>
  )
}
