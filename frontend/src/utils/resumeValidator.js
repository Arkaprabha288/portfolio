/**
 * resumeValidator.js
 * Two-stage resume validation:
 *  1. Fast heuristic check on extracted text (no API call)
 *  2. Gemini-powered confirmation (uses minimal tokens)
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1/models'
const MODELS = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash']

// Keywords commonly found in resumes
const RESUME_SIGNALS = [
  'experience', 'education', 'skills', 'work history', 'employment',
  'university', 'college', 'degree', 'bachelor', 'master', 'b.tech', 'm.tech',
  'internship', 'projects', 'certifications', 'summary', 'objective',
  'responsibilities', 'achievements', 'references', 'linkedin', 'github',
]

/**
 * Stage 1: Fast local heuristic — no API call needed.
 * Returns { valid: bool, reason: string }
 */
export function heuristicCheck(text) {
  if (!text || text.trim().length < 50) {
    return { valid: false, reason: 'The file appears to be empty or contains no readable text. Make sure it is a text-based PDF, not a scanned image.' }
  }

  const lower = text.toLowerCase()
  const hits = RESUME_SIGNALS.filter(kw => lower.includes(kw))

  if (hits.length < 2) {
    return {
      valid: false,
      reason: `This doesn't look like a resume. No resume-related keywords were found (e.g. experience, education, skills).\n\nPlease upload your CV or resume file.`,
    }
  }

  return { valid: true, reason: '' }
}

/**
 * Stage 2: Ask Gemini to confirm it's a resume.
 * Returns { valid: bool, reason: string }
 */
export async function geminiValidate(text, apiKey) {
  const prompt = `You are a document classifier. Read the text below and answer with ONLY a JSON object like:
{"isResume": true, "reason": "short reason"}
or
{"isResume": false, "reason": "short reason explaining what the document actually is"}

Document text (first 1500 chars):
===
${text.slice(0, 1500)}
===`

  for (const model of MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0 },
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        const code = result?.error?.code
        if (code === 429 || code === 404) continue
        throw new Error(`Validation API error: ${res.status}`)
      }

      const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(cleaned)

      return {
        valid: parsed.isResume === true,
        reason: parsed.isResume
          ? ''
          : `This file does not appear to be a resume.\n\nGemini says: "${parsed.reason}"\n\nPlease upload your CV or resume PDF.`,
      }
    } catch {
      continue
    }
  }

  // If all Gemini calls fail, trust the heuristic and proceed
  return { valid: true, reason: '' }
}
