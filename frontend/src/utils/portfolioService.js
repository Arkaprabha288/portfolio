/**
 * portfolioService.js
 * Handles saving and fetching portfolio data from the backend.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

/**
 * Save portfolio data to MongoDB via the backend.
 * @param {Object} data - parsed portfolio JSON
 * @returns {Promise<string>} uuid
 */
export async function savePortfolio(data) {
  const res = await fetch(`${API_BASE}/api/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to save portfolio.')
  }

  const result = await res.json()
  return result.uuid
}

/**
 * Fetch portfolio data by UUID from the backend.
 * @param {string} uuid
 * @returns {Promise<Object>} portfolio data
 */
export async function fetchPortfolio(uuid) {
  const res = await fetch(`${API_BASE}/api/portfolio/${uuid}`)

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Portfolio not found.')
  }

  const result = await res.json()
  return result.data
}
