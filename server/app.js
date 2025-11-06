// app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const emailRoutes = require("./routes/emailRoutes");
const commentRoutes = require("./routes/commentRoutes");
const siteRoutes = require("./routes/siteRoute");
const authRoutes = require("./routes/authRoutes.js");
const userRoutes = require("./routes/users.js");
const siteContentRoutes = require("./routes/siteContent.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
// API routes
app.use("/api/auth", authRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/site", siteContentRoutes); // Add site content routes
app.use("/api/users", userRoutes); // Add user management routes
app.use("/api", emailRoutes);
app.use("/api/comments", commentRoutes);

// Serve the admin dashboard
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Admin.html")); // Save the HTML as admin.html
});
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// Serve the comments page (HTML file)
app.get("/comments", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "comments.html"));
});

// Default route (opens contact page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);