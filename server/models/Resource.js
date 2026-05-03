const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  subject: {
    type: String,
    default: "General",
    trim: true
  },
  resourceType: {
    type: String,
    default: "Notes",
    enum: ["Notes", "PDF", "Paper", "PPT", "Other"]
  },
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      stars:  { type: Number, min: 1, max: 5 }
    }
  ],
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual: average rating
resourceSchema.virtual("avgRating").get(function () {
  if (!this.ratings.length) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.stars, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

resourceSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Resource", resourceSchema);
