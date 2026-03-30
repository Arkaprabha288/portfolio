/**
 * logger.js
 * Simple in-memory logger that stores logs and triggers a listener.
 */

const logs = []
let listener = null

export const logger = {
  subscribe(fn) { listener = fn },
  unsubscribe()  { listener = null },

  log(msg, data) {
    const entry = { level: 'info', msg, data: data ?? null, time: new Date().toLocaleTimeString() }
    logs.push(entry)
    console.log(`[Portfolito] ${msg}`, data ?? '')
    listener?.([ ...logs ])
  },

  warn(msg, data) {
    const entry = { level: 'warn', msg, data: data ?? null, time: new Date().toLocaleTimeString() }
    logs.push(entry)
    console.warn(`[Portfolito] ${msg}`, data ?? '')
    listener?.([ ...logs ])
  },

  error(msg, data) {
    const entry = { level: 'error', msg, data: data ?? null, time: new Date().toLocaleTimeString() }
    logs.push(entry)
    console.error(`[Portfolito] ${msg}`, data ?? '')
    listener?.([ ...logs ])
  },

  clear() {
    logs.length = 0
    listener?.([ ...logs ])
  },

  getAll() { return [ ...logs ] },
}

/**
 * Download extracted data as a JSON file in the browser.
 * @param {string} rawText  - raw PDF text
 * @param {object} parsed   - structured portfolio data
 */
export function downloadExtractedData(rawText, parsed) {
  const payload = {
    extractedAt: new Date().toISOString(),
    rawText,
    parsedData: parsed,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `resume-extracted-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}
