const express = require('express')
const { v4: uuidv4 } = require('uuid')
const Portfolio = require('../models/Portfolio')
const { askBedrock } = require('../lib/bedrock')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// POST /api/portfolio/parse — parse raw resume text via Bedrock, return structured JSON
router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: 'Resume text is too short or missing.' })
    }

    const prompt = `You are an expert resume parser. Extract ALL information from the resume text and return a single valid JSON object.

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
${text}
===`

    const raw = await askBedrock(prompt)

    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(500).json({ error: 'Bedrock returned invalid JSON.', raw: cleaned.slice(0, 300) })
    }

    parsed.skills     = Array.isArray(parsed.skills)     ? parsed.skills     : []
    parsed.experience = Array.isArray(parsed.experience) ? parsed.experience : []
    parsed.education  = Array.isArray(parsed.education)  ? parsed.education  : []
    parsed.projects   = Array.isArray(parsed.projects)   ? parsed.projects   : []

    return res.json(parsed)
  } catch (err) {
    console.error('[POST /api/portfolio/parse]', err.message)
    if (err.name === 'AccessDeniedException') {
      return res.status(403).json({ error: 'Bedrock access denied. Check IAM permissions.' })
    }
    return res.status(500).json({ error: 'Failed to parse resume.' })
  }
})

// POST /api/portfolio — save parsed resume data, return uuid
router.post('/', async (req, res) => {
  try {
    const { data } = req.body
    if (!data || !data.name)
      return res.status(400).json({ error: 'Invalid portfolio data — name is required.' })

    // attach userId if request carries a valid token (optional auth)
    let userId = null
    try {
      const { verifyToken } = require('../lib/jwt')
      const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
      if (token) userId = verifyToken(token).id
    } catch {}

    const uuid = uuidv4()
    const portfolio = await Portfolio.create({ uuid, userId, data })
    return res.status(201).json({ uuid: portfolio.uuid, createdAt: portfolio.createdAt })
  } catch (err) {
    console.error('[POST /api/portfolio]', err.message)
    return res.status(500).json({ error: 'Failed to save portfolio.' })
  }
})

// GET /api/portfolio/:uuid — fetch portfolio by uuid
router.get('/:uuid', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ uuid: req.params.uuid })

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found.' })
    }

    return res.json({
      uuid: portfolio.uuid,
      data: portfolio.data,
      createdAt: portfolio.createdAt,
    })
  } catch (err) {
    console.error('[GET /api/portfolio/:uuid]', err.message)
    return res.status(500).json({ error: 'Failed to fetch portfolio.' })
  }
})

// POST /api/portfolio/:uuid/analyze — AI-powered portfolio analysis via AWS Bedrock
// Uses Amazon Nova Micro (cheapest model) — great for dev, costs fractions of a cent
router.post('/:uuid/analyze', async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ uuid: req.params.uuid })

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found.' })
    }

    const { data } = portfolio

    // Build a concise prompt from portfolio data to keep token usage low
    const prompt = `
        Here is a person's portfolio/resume data:

        Name: ${data.name || 'N/A'}
        Skills: ${Array.isArray(data.skills) ? data.skills.join(', ') : data.skills || 'N/A'}
        Experience: ${JSON.stringify(data.experience || data.work || [], null, 2)}
        Education: ${JSON.stringify(data.education || [], null, 2)}
        Projects: ${JSON.stringify(data.projects || [], null, 2)}

        Please provide:
        1. A 2-sentence professional summary
        2. Top 3 strengths based on their experience
        3. One skill gap suggestion to improve their profile

        Keep the response concise and professional.
    `.trim()

    const systemPrompt =
      'You are a professional career coach and resume expert. Give actionable, encouraging feedback.'

    const analysis = await askBedrock(prompt, systemPrompt)

    return res.json({
      uuid: portfolio.uuid,
      analysis,
      model: 'amazon.nova-micro-v1:0',
      analyzedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[POST /api/portfolio/:uuid/analyze]', err.message)

    // Give a helpful error if Bedrock IAM permissions aren't set up yet
    if (err.name === 'AccessDeniedException') {
      return res.status(403).json({
        error: 'Bedrock access denied. Check IAM permissions in serverless.yml or enable Nova Micro model access in AWS Console → Bedrock → Model Access.',
      })
    }

    return res.status(500).json({ error: 'Failed to analyze portfolio.' })
  }
})

// PUT /api/portfolio/:uuid — edit portfolio data (owner only)
router.put('/:uuid', requireAuth, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ uuid: req.params.uuid })
    if (!portfolio) return res.status(404).json({ error: 'Portfolio not found.' })
    if (!portfolio.userId || portfolio.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Not authorized to edit this portfolio.' })

    portfolio.data = { ...portfolio.data, ...req.body.data }
    await portfolio.save()
    return res.json({ uuid: portfolio.uuid, data: portfolio.data })
  } catch (err) {
    console.error('[PUT /api/portfolio/:uuid]', err.message)
    return res.status(500).json({ error: 'Failed to update portfolio.' })
  }
})

module.exports = router