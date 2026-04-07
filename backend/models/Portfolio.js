const mongoose = require('mongoose')

const portfolioSchema = new mongoose.Schema(
  {
    uuid: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Portfolio', portfolioSchema)
