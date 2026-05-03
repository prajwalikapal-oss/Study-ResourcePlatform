const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  subject: {
    type: String,
    default: "General",
    trim: true
  },
  priority: {
    type: String,
    default: "medium",
    enum: ["high", "medium", "low"]
  },
  dueDate: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Task", taskSchema);
