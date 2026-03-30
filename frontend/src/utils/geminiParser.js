/**
 * geminiParser.js
 * Uses Google Gemini 1.5 Flash to extract structured resume data.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1/models'

// Tried in order — first one that works wins
const MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
]

const buildPrompt = (resumeText) => `
You are an expert resume parser. Extract ALL information from the resume text and return a single valid JSON object.

STRICT RULES:
- Return ONLY raw JSON. No markdown, no code fences, no explanation whatsoever.
- Extract every piece of information present.
- If a field is missing, use null for strings or [] for arrays.
- skills: flat array of ALL skills, tools, languages, frameworks, cloud services mentioned anywhere.
- experience: ALL jobs with ALL bullet points.
- education: ALL degrees with institution, year, GPA/percentage.
- projects: any projects mentioned, or [].

Required JSON structure:
{
  "name": "Full Name",
  "title": "Current or most recent job title",
  "summary": "Profile summary text verbatim",
  "email": "email or null",
  "phone": "phone or null",
  "location": "City, Country or null",
  "linkedin": "full URL or null",
  "github": "full URL or null",
  "website": "full URL or null",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "Job Title", "company": "Company", "period": "Date range", "bullets": ["bullet1"] }
  ],
  "education": [
    { "degree": "Degree", "school": "Institution", "period": "Years", "gpa": "GPA or null" }
  ],
  "projects": [
    { "name": "Name", "description": "Description", "tech": ["tech1"], "link": "URL or null" }
  ]
}

Resume:
===
${resumeText}
===`

export async function parseResumeWithGemini(rawText) {
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not set.')

  let lastError = null

  for (const model of MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(rawText) }] }],
          generationConfig: { temperature: 0.1 },
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        const code = result?.error?.code
        // 429 or 404 → try next model
        if (code === 429 || code === 404) {
          lastError = `${model}: ${result?.error?.message?.slice(0, 80)}`
          continue
        }
        throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(result)}`)
      }

      const rawResponse = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawResponse) throw new Error(`Gemini (${model}) returned no content.`)

      const cleaned = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch (e) {
        throw new Error(`Failed to parse JSON from ${model}: ${cleaned.slice(0, 200)}`)
      }

      parsed.skills     = Array.isArray(parsed.skills)     ? parsed.skills     : []
      parsed.experience = Array.isArray(parsed.experience) ? parsed.experience : []
      parsed.education  = Array.isArray(parsed.education)  ? parsed.education  : []
      parsed.projects   = Array.isArray(parsed.projects)   ? parsed.projects   : []

      return parsed

    } catch (err) {
      // Only rethrow if it's not a quota/not-found issue
      if (!err.message?.includes('429') && !err.message?.includes('404')) throw err
      lastError = err.message
    }
  }

  throw new Error(`All Gemini models exhausted quota or unavailable.\n\nLast error: ${lastError}`)
}
