const mongoose = require('mongoose')

const portfolioSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // stores the full parsed JSON as-is
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
)

module.exports = mongoose.model('Portfolio', portfolioSchema)
