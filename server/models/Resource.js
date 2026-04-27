const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  fileUrl: String
});

module.exports = mongoose.model("Resource", userSchema);