const { verifyToken } = require('../lib/jwt')

function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Not authenticated.' })
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

module.exports = { requireAuth }
