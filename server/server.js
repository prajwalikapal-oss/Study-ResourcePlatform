// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();
// // console.log(process.env.MONGO_URI);

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test route
// app.get("/", (req, res) => {
//   res.send("Server is running...");
// });

// // Connect MongoDB
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => {
//     console.error("MongoDB Error:", err);
//     process.exit(1); // stop server if DB fails
//   });

// // mongoose.connect(process.env.MONGO_URI, {
// //   family: 4   // Force Node.js to use IPv4 + stable connection instead of of IPv6
// // })
// // .then(() => console.log("MongoDB Connected"))
// // .catch((err) => console.log(err));

// // Start server
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// // Create API route
// const User = require("./models/User");

// app.get("/add", async (req, res) => {
//   try {
//     const user = new User({
//       name: "Manas",
//       email: "manas@test.com"
//     });

//     await user.save();

//     res.send("User added to DB");
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// // Creating POST API
// app.post("/users", async (req, res) => {
//   try {
//     const { name, email } = req.body;

//     const user = new User({
//       name,
//       email
//     });

//     await user.save();

//     res.status(201).json({ message: "User created", user });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Creating GET route (Backend)
// app.get("/users", async (req, res) => {
//   try {
//     const users = await User.find(); // DB model
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Addding DELETE User Feature 
// app.delete("/users/:id", async (req, res) => {
//   try {
//     const id = req.params.id;
//     await User.findByIdAndDelete(id);
//     res.json({ message: "User deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });


// Newer Version
// ------------------

// For Adding file and uploading support
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();
const Task = require("./models/Task");
const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// IMPORTANT: serve uploaded files
app.use("/uploads", express.static("uploads"));

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* =========================
   MONGODB CONNECT
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log("MongoDB Error:", err);
  });

/* =========================
   MODEL
========================= */
const Resource = require("./models/Resource"); // (we will rename later)

/* =========================
   HOME
========================= */
app.get("/", (req, res) => {
  res.send("College Resource API Running");
});

/* =========================
   CREATE RESOURCE (WITH FILE)
========================= */
app.post("/resources", upload.single("file"), async (req, res) => {
  try {
    const { title, description } = req.body;

    const fileUrl = req.file ? req.file.filename : null;

    const resource = new Resource({
      name: title,
      email: description,
      fileUrl: fileUrl
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

/* =========================
   GET ALL RESOURCES
========================= */
app.get("/resources", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   DELETE RESOURCE
========================= */
app.delete("/resources/:id", async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   TASK APIs
========================= */

// Create Task
app.post("/tasks", async (req, res) => {
  try {
    const { text } = req.body;

    const task = new Task({ text });
    await task.save();

    res.status(201).json(task);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Route
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

/* 
   START SERVER
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});

