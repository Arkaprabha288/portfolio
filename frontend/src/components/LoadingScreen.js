import { useEffect, useState } from 'react'
import { logger } from '../utils/logger'
import './LoadingScreen.css'

const STEPS = [
  'Extracting text from resume...',
  'Analyzing with Gemini AI...',
  'Building your portfolio...',
]

export default function LoadingScreen({ message, fileName }) {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Subscribe to live log updates
    logger.subscribe(setLogs)
    setLogs(logger.getAll())
    return () => logger.unsubscribe()
  }, [])

  // Derive progress from current message
  const stepIdx = STEPS.findIndex(s => message?.includes(s.split(' ')[0]))
  const progress = message
    ? Math.max(10, Math.round(((stepIdx + 1) / STEPS.length) * 100))
    : 10

  return (
    <div className="loading-page">
      <div className="loading-orb orb-1" />
      <div className="loading-orb orb-2" />

      <div className="loading-container">
        {/* Spinner */}
        <div className="spinner-wrapper">
          <div className="spinner-ring" />
          <div className="spinner-ring ring-2" />
          <div className="spinner-core">
            <span className="spinner-pct">{progress}%</span>
          </div>
        </div>

        <h2 className="loading-title">Building Your Portfolio</h2>
        {fileName && <p className="loading-filename">📄 {fileName}</p>}
        <p className="loading-message">{message}</p>

        {/* Progress bar */}
        <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Live log panel */}
        {logs.length > 0 && (
          <div className="log-panel">
            <p className="log-panel-title">⚡ Live Log</p>
            <div className="log-entries">
              {logs.map((entry, i) => (
                <div key={i} className={`log-entry log-${entry.level}`}>
                  <span className="log-time">{entry.time}</span>
                  <span className="log-msg">{entry.msg}</span>
                  {entry.data && (
                    <span className="log-data">
                      {typeof entry.data === 'object'
                        ? JSON.stringify(entry.data).slice(0, 120)
                        : String(entry.data)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
