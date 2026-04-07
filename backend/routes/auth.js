const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const multer = require('multer')
const multerS3 = require('multer-s3')
const { S3Client } = require('@aws-sdk/client-s3')
const User = require('../models/User')
const { signToken } = require('../lib/jwt')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

// ── Google OAuth strategy ────────────────────────────────────
// Pick callback URL: use production URL when running in Lambda, localhost otherwise
const callbackUrls = (process.env.GOOGLE_CALLBACK_URL || '').split(',').map(u => u.trim())
const callbackURL = process.env.LAMBDA_TASK_ROOT
  ? callbackUrls.find(u => !u.includes('localhost')) || callbackUrls[0]
  : callbackUrls.find(u => u.includes('localhost')) || callbackUrls[0]

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id })
    if (!user) {
      user = await User.findOne({ email: profile.emails[0].value })
      if (user) {
        user.googleId = profile.id
        if (!user.avatar) user.avatar = profile.photos?.[0]?.value || null
        await user.save()
      } else {
        user = await User.create({
          name:     profile.displayName,
          email:    profile.emails[0].value,
          googleId: profile.id,
          avatar:   profile.photos?.[0]?.value || null,
        })
      }
    }
    done(null, user)
  } catch (err) {
    done(err)
  }
}))

// ── S3 upload for profile pictures ──────────────────────────
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' })

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AVATAR_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => cb(null, `avatars/${req.user.id}-${Date.now()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'))
    cb(null, true)
  },
})

// ── Helper: send JWT as cookie + JSON ───────────────────────
function sendToken(res, user) {
  const token = signToken(user)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  return res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
  })
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' })
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ error: 'Email already registered.' })

    const user = await User.create({ name, email, password })
    return sendToken(res, user)
  } catch (err) {
    console.error('[POST /api/auth/register]', err.message)
    return res.status(500).json({ error: 'Registration failed.' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' })

    const user = await User.findOne({ email })
    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid email or password.' })

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' })

    return sendToken(res, user)
  } catch (err) {
    console.error('[POST /api/auth/login]', err.message)
    return res.status(500).json({ error: 'Login failed.' })
  }
})

// GET /api/auth/google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
}))

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL?.split(',')[0]}/login?error=google_failed` }),
  (req, res) => {
    const token = signToken(req.user)
    // Redirect to frontend with token in query param — frontend stores it
    const frontendUrl = process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  }
)

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: 'Logged out.' })
})

// GET /api/auth/me — get current user from token
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found.' })
    res.json({ id: user._id, name: user.name, email: user.email, avatar: user.avatar })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' })
  }
})

// POST /api/auth/avatar — upload profile picture
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })
    const avatarUrl = req.file.location // S3 URL from multer-s3
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl })
    res.json({ avatar: avatarUrl })
  } catch (err) {
    console.error('[POST /api/auth/avatar]', err.message)
    res.status(500).json({ error: 'Avatar upload failed.' })
  }
})

module.exports = router
