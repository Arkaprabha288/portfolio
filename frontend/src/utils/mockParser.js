/**
 * mockParser.js
 * 
 * Option B: Simulated/mock resume parser.
 * Takes raw text extracted from a PDF and attempts basic heuristic parsing.
 * Falls back to a richly populated demo dataset so the portfolio always looks great.
 */

/**
 * Try to extract a name from the first few lines of a resume.
 */
function extractName(lines) {
  // Typically the name is one of the first non-empty lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    // A name is usually 2-4 words, no digits, not too long
    if (line && line.split(' ').length >= 2 && line.split(' ').length <= 5 && !/\d/.test(line) && line.length < 50) {
      return line
    }
  }
  return null
}

/**
 * Try to extract an email from text.
 */
function extractEmail(text) {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i)
  return match ? match[0] : null
}

/**
 * Try to extract a phone number from text.
 */
function extractPhone(text) {
  const match = text.match(/(\+?\d[\d\s\-(). ]{8,}\d)/)
  return match ? match[0].trim() : null
}

/**
 * Try to extract a LinkedIn URL from text.
 */
function extractLinkedIn(text) {
  const match = text.match(/linkedin\.com\/in\/[\w-]+/i)
  return match ? `https://${match[0]}` : null
}

/**
 * Try to extract a GitHub URL from text.
 */
function extractGitHub(text) {
  const match = text.match(/github\.com\/[\w-]+/i)
  return match ? `https://${match[0]}` : null
}

/**
 * Extract a section of a resume by common heading keywords.
 */
function extractSection(lines, keywords) {
  const keywordLower = keywords.map(k => k.toLowerCase())
  let inSection = false
  const sectionLines = []
  const nextSectionKeywords = [
    'experience', 'education', 'skills', 'projects', 'certifications',
    'awards', 'publications', 'references', 'summary', 'objective',
    'work history', 'employment', 'volunteer', 'languages', 'interests', 'contact'
  ]

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase().trim()
    const isHeading = keywordLower.some(k => lineLower === k || lineLower.startsWith(k + ':') || lineLower.startsWith(k + ' '))
    const isOtherHeading = !isHeading && nextSectionKeywords.some(k =>
      lineLower === k || lineLower.startsWith(k + ':') || lineLower.startsWith(k + ' ')
    )

    if (isHeading) { inSection = true; continue }
    if (inSection && isOtherHeading) { inSection = false; continue }
    if (inSection && lines[i].trim()) { sectionLines.push(lines[i].trim()) }
  }
  return sectionLines
}

/**
 * Parse skills from a skills section.
 */
function parseSkills(skillLines) {
  const joined = skillLines.join(' ')
  // Split by common delimiters
  const raw = joined.split(/[,|•·\n\/]+/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 40)
  return [...new Set(raw)].slice(0, 24)
}

/**
 * Parse experience entries (heuristic).
 */
function parseExperience(expLines) {
  const entries = []
  let current = null

  for (const line of expLines) {
    // Date patterns like "Jan 2020 – Present", "2018 - 2022"
    const dateMatch = line.match(/(\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b.*?–.*?(present|\d{4}))/i)
    // Lines that likely start a new job (capitalized, short, no sentence punctuation)
    const isTitle = /^[A-Z]/.test(line) && line.length < 80 && !line.endsWith('.')

    if (dateMatch || (isTitle && current)) {
      if (current) entries.push(current)
      current = {
        title: '',
        company: '',
        period: dateMatch ? dateMatch[0] : '',
        bullets: []
      }
      if (!dateMatch) current.title = line
    } else if (current) {
      if (!current.title) current.title = line
      else if (!current.company && line.length < 60) current.company = line
      else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        current.bullets.push(line.replace(/^[•\-*]\s*/, ''))
      } else if (current.bullets.length < 4 && line.length > 20) {
        current.bullets.push(line)
      }
    }
  }
  if (current) entries.push(current)
  return entries.filter(e => e.title || e.company).slice(0, 5)
}

/**
 * Parse education entries (heuristic).
 */
function parseEducation(eduLines) {
  const entries = []
  let current = null

  for (const line of eduLines) {
    const degreeKeywords = /\b(bachelor|master|b\.?s\.?|m\.?s\.?|b\.?e\.?|m\.?e\.?|ph\.?d|mba|b\.?tech|m\.?tech|associate|diploma|degree)\b/i
    const yearMatch = line.match(/\b(19|20)\d{2}\b/)
    const isDegree = degreeKeywords.test(line)

    if (isDegree || (yearMatch && !current)) {
      if (current) entries.push(current)
      current = { degree: isDegree ? line : '', school: '', period: yearMatch ? yearMatch[0] : '', gpa: '' }
    } else if (current) {
      if (!current.school && line.length < 80) current.school = line
      else if (line.match(/gpa|cgpa/i)) current.gpa = line
    }
  }
  if (current) entries.push(current)
  return entries.filter(e => e.degree || e.school).slice(0, 4)
}

/**
 * Parse projects (heuristic).
 */
function parseProjects(projLines) {
  const projects = []
  let current = null

  for (const line of projLines) {
    const isTitle = /^[A-Z]/.test(line) && line.length < 60 && !line.endsWith('.')
    if (isTitle && (!current || current.bullets.length > 0)) {
      if (current) projects.push(current)
      current = { name: line, description: '', bullets: [], tech: [] }
    } else if (current) {
      if (!current.description && line.length > 20) current.description = line
      else if (line.startsWith('•') || line.startsWith('-')) current.bullets.push(line.replace(/^[•\-*]\s*/, ''))
    }
  }
  if (current) projects.push(current)
  return projects.filter(p => p.name).slice(0, 4)
}

/**
 * The fallback/demo structured portfolio data used when parsing fails.
 */
function getFallbackData(rawText) {
  // Try to snag whatever real info we can, fall back to demo values
  const lines = (rawText || '').split('\n').filter(l => l.trim())
  const text = lines.join(' ')

  return {
    name: extractName(lines) || 'Alex Johnson',
    title: 'Full Stack Developer & Creative Technologist',
    summary:
      'Passionate developer with 5+ years of experience building high-performance web applications. ' +
      'Loved crafting elegant solutions to complex problems, with a focus on user experience and clean code. ' +
      'Open-source contributor and lifelong learner.',
    email: extractEmail(text) || 'alex.johnson@email.com',
    phone: extractPhone(text) || '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    linkedin: extractLinkedIn(text) || 'https://linkedin.com/in/alexjohnson',
    github: extractGitHub(text) || 'https://github.com/alexjohnson',
    website: 'https://alexjohnson.dev',

    experience: [
      {
        title: 'Senior Frontend Engineer',
        company: 'Acme Corp',
        period: 'Jan 2022 – Present',
        bullets: [
          'Led a team of 5 to rebuild the main product dashboard, reducing load time by 60%.',
          'Architected a reusable component library used across 3 product teams.',
          'Mentored junior developers and conducted 100+ code reviews.',
        ],
      },
      {
        title: 'Full Stack Developer',
        company: 'Startup Labs',
        period: 'Jun 2019 – Dec 2021',
        bullets: [
          'Built and shipped a real-time collaboration tool using React & WebSockets.',
          'Designed a REST API with Node.js / Express serving 10k+ daily active users.',
          'Integrated Stripe payment processing, handling $500k+ in annual transactions.',
        ],
      },
      {
        title: 'Junior Developer',
        company: 'Digital Agency XYZ',
        period: 'Aug 2017 – May 2019',
        bullets: [
          'Developed 20+ client websites using HTML, CSS, JavaScript, and WordPress.',
          'Improved page performance scores from 45 → 92 on Google Lighthouse.',
        ],
      },
    ],

    education: [
      {
        degree: 'B.S. in Computer Science',
        school: 'University of California, Berkeley',
        period: '2013 – 2017',
        gpa: 'GPA: 3.8 / 4.0',
      },
    ],

    skills: [
      'React', 'TypeScript', 'Node.js', 'Next.js', 'GraphQL', 'PostgreSQL',
      'MongoDB', 'Docker', 'AWS', 'Redis', 'Python', 'Figma',
      'HTML5', 'CSS3', 'Tailwind', 'Git', 'CI/CD', 'REST APIs',
    ],

    projects: [
      {
        name: 'DevFlow – Open-Source Dev Tool',
        description: 'A CLI productivity suite for developers that automates repetitive Git workflows and generates project scaffolding.',
        tech: ['Node.js', 'TypeScript', 'Shell'],
        link: 'https://github.com/alexjohnson/devflow',
      },
      {
        name: 'Snapgrid – Image Portfolio SaaS',
        description: 'A multi-tenant SaaS for photographers to build and host portfolio sites, processing 1M+ images monthly.',
        tech: ['Next.js', 'AWS S3', 'Stripe', 'PostgreSQL'],
        link: 'https://snapgrid.io',
      },
      {
        name: 'ChartFlow – Real-time Data Viz',
        description: 'An embeddable charting library supporting 15+ chart types with live data streaming via WebSockets.',
        tech: ['React', 'D3.js', 'WebSockets'],
        link: 'https://github.com/alexjohnson/chartflow',
      },
    ],
  }
}

/**
 * Main parse function.
 * @param {string} rawText – text extracted from the PDF
 * @returns {Object} structured portfolio data
 */
export function parseResume(rawText) {
  if (!rawText || rawText.trim().length < 50) {
    return getFallbackData('')
  }

  const lines = rawText.split('\n').filter(l => l.trim())
  const text = lines.join(' ')

  const name = extractName(lines)
  const email = extractEmail(text)
  const phone = extractPhone(text)
  const linkedin = extractLinkedIn(text)
  const github = extractGitHub(text)

  const skillLines   = extractSection(lines, ['skills', 'technical skills', 'core competencies', 'technologies'])
  const expLines     = extractSection(lines, ['experience', 'work experience', 'employment', 'work history'])
  const eduLines     = extractSection(lines, ['education', 'academic background', 'qualifications'])
  const projLines    = extractSection(lines, ['projects', 'personal projects', 'key projects'])
  const summaryLines = extractSection(lines, ['summary', 'profile', 'objective', 'about'])

  const skills     = parseSkills(skillLines)
  const experience = parseExperience(expLines)
  const education  = parseEducation(eduLines)
  const projects   = parseProjects(projLines)
  const summary    = summaryLines.join(' ').slice(0, 500)

  // Merge with fallbacks for any missing data
  const fallback = getFallbackData(rawText)

  return {
    name:       name     || fallback.name,
    title:      fallback.title,
    summary:    summary  || fallback.summary,
    email:      email    || fallback.email,
    phone:      phone    || fallback.phone,
    location:   fallback.location,
    linkedin:   linkedin || fallback.linkedin,
    github:     github   || fallback.github,
    website:    fallback.website,
    skills:     skills.length     > 2  ? skills     : fallback.skills,
    experience: experience.length > 0  ? experience : fallback.experience,
    education:  education.length  > 0  ? education  : fallback.education,
    projects:   projects.length   > 0  ? projects   : fallback.projects,
  }
}
