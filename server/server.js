// Newer Version
// ------------------

// IMPORTS
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// FILE UPLOAD
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// MODELS
const Task = require("./models/Task");
const Resource = require("./models/Resource");
const User = require("./models/User");

// AUTH LIBS
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();


// FILE UPLOAD SETUP

const uploadPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Serve uploaded files
app.use("/uploads", express.static(uploadPath));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });


// CORS

const allowedOrigins = [
  "http://localhost:5173",
  "https://study-resource-platform.vercel.app",
  "https://study-resourceplatform.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));


// MIDDLEWARE

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// DATABASE

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });


// AUTH MIDDLEWARE

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Expecting: Bearer TOKEN
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};


// ROUTES

// Home
app.get("/", (req, res) => {
  res.send("College Resource API Running");
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});


// AUTH APIs

// REGISTER
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({ message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// LOGIN
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// RESOURCE APIs

// CREATE RESOURCE (Protected)
app.post("/resources", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description required" });
    }

    const resource = new Resource({
      title,
      description,
      fileUrl: req.file ? req.file.filename : null,
      userId: req.user.userId,
      subject: req.body.subject || "General",
      resourceType: req.body.resourceType || "Notes"
    });

    await resource.save();

    res.status(201).json({
      message: "Resource created successfully",
      resource
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET RESOURCES (User-specific)
app.get("/resources", authMiddleware, async (req, res) => {
  try {
    // const resources = await Resource.find({
    //   userId: req.user.userId
    // }).sort({ createdAt: -1 });
    const resources = await Resource.find({}).sort({ createdAt: -1 });

    res.json(resources);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE RESOURCE (Secure)
app.delete("/resources/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Resource.findOneAndDelete({
      _id: req.params.id,
      // userId: req.user.userId
    });

    if (!deleted) {
      return res.status(404).json({ error: "Resource not found or unauthorized" });
    }

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DOWNLOAD COUNTER
app.post("/resources/:id/download", authMiddleware, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json({ downloadCount: resource.downloadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RATE RESOURCE
app.post("/resources/:id/rate", authMiddleware, async (req, res) => {
  try {
    const { stars } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Stars must be between 1 and 5" });
    }

    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Check if user already rated
    const existingRating = resource.ratings.find(
      r => r.userId.toString() === req.user.userId.toString()
    );

    if (existingRating) {
      // Update existing rating
      existingRating.stars = stars;
    } else {
      // Add new rating
      resource.ratings.push({ userId: req.user.userId, stars });
    }

    await resource.save();

    res.json({
      message: "Rating saved!",
      avgRating: resource.avgRating,
      totalRatings: resource.ratings.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TASK APIs

// CREATE TASK
app.post("/tasks", async (req, res) => {
  try {
    const { text, subject, priority, dueDate } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Task text required" });
    }

    const task = new Task({
      text,
      subject: subject || "General",
      priority: priority || "medium",
      dueDate: dueDate || null
    });
    await task.save();

    res.status(201).json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET TASKS
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// UPDATE TASK
app.put("/tasks/:id", async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: req.body.completed },
      { new: true }
    );

    res.json(updatedTask);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE TASK
app.delete("/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Server error" });
});


// START SERVER

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
