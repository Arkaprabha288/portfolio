require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const rateLimit = require('express-rate-limit')
const serverless = require('serverless-http')
const portfolioRoutes = require('./routes/portfolio')
const authRoutes = require('./routes/auth')

const app = express()

// Trust proxy headers from API Gateway / CloudFront
app.set('trust proxy', 1)

// ── Rate limiters ────────────────────────────────────────────
// General: 100 requests per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Strict: 3 requests per 20 seconds for heavy AI/parse endpoints
const strictLimiter = rateLimit({
  windowMs: 20 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 20 seconds before trying again.', retryAfter: 20 },
})

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, Postman, Lambda-to-Lambda)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())
app.use(passport.initialize())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/portfolio', generalLimiter, portfolioRoutes)
app.use('/api/portfolio/parse', strictLimiter)
app.use('/api/portfolio/:uuid/analyze', strictLimiter)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// Reuse MongoDB connection across Lambda invocations
let isConnected = false
async function connectDB() {
  if (isConnected) return
  await mongoose.connect(process.env.MONGO_URI)
  isConnected = true
  console.log('✅ MongoDB connected')
}

// Lambda handler
const handler = serverless(app)
module.exports.handler = async (event, context) => {
  // Prevent Lambda from waiting for event loop to drain
  context.callbackWaitsForEmptyEventLoop = false
  await connectDB()
  return handler(event, context)
}

// Local dev server (only runs when not in Lambda)
if (!process.env.LAMBDA_TASK_ROOT) {
  const PORT = process.env.PORT || 5000
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ MongoDB connected')
      app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message)
      process.exit(1)
    })
}
