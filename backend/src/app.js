const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/factures", require("./routes/factures"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes")); // ← NOUVELLE ROUTE

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartLab Server is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

module.exports = app;
