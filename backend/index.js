require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const portfolioRoutes = require('./routes/portfolio')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json({ limit: '2mb' }))

// Routes
app.use('/api/portfolio', portfolioRoutes)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// Connect to MongoDB then start server
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
