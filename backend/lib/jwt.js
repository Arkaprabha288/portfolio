const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET || 'change_me_in_production'

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, avatar: user.avatar },
    SECRET,
    { expiresIn: '7d' }
  )
}

function verifyToken(token) {
  return jwt.verify(token, SECRET)
}

module.exports = { signToken, verifyToken }
