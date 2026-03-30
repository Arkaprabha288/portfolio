const express = require('express')
const { v4: uuidv4 } = require('uuid')
const Portfolio = require('../models/Portfolio')

const router = express.Router()

// POST /api/portfolio — save parsed resume data, return uuid
router.post('/', async (req, res) => {
  try {
    const { data } = req.body

    if (!data || !data.name) {
      return res.status(400).json({ error: 'Invalid portfolio data — name is required.' })
    }

    const uuid = uuidv4()
    const portfolio = await Portfolio.create({ uuid, data })

    return res.status(201).json({
      uuid: portfolio.uuid,
      createdAt: portfolio.createdAt,
    })
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

module.exports = router
