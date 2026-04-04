/**
 * bedrockParser.js
 * Sends raw resume text to the backend, which uses AWS Bedrock (Nova Micro) to parse it.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

export async function parseResumeWithBedrock(rawText) {
  const res = await fetch(`${API_BASE}/api/portfolio/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Bedrock parsing failed.')
  }

  return data
}
