const mongoose = require("mongoose");

const MemorySchema = new mongoose.Schema({
  userId: String,
  topic: String,
  strength: {
    type: Number,
    default: 1
  },
  lastReviewed: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Memory", MemorySchema);