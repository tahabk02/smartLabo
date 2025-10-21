const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// CONNEXION BASE DE DONNÉES
// ==========================================
connectDB();

// ==========================================
// ROUTES EXISTANTES
// ==========================================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/factures", require("./routes/factures"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/analyses", require("./routes/analyses"));
app.use("/api/analyse-types", require("./routes/analyseTypes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/ai-agent", require("./routes/aiAgentRoutes"));

// ==========================================
// 🆕 NOUVELLES ROUTES - DOSSIER MÉDICAL
// ==========================================

// Medical Records (Dossier médical central)
app.use("/api/medical-records", require("./routes/medicalRecords"));

// Patient Analyses (Résultats d'analyses patients)
app.use("/api/patient-analyses", require("./routes/patientAnalyses"));

// Prescriptions (Ordonnances)
app.use("/api/prescriptions", require("./routes/prescriptions"));

// ==========================================
// 🆕 ROUTES PATIENT (Espace Patient)
// ==========================================
app.use("/api/patient", require("./routes/patientAppointments"));

// ==========================================
// STATIC FILES
// ==========================================
app.use("/uploads", express.static("uploads"));

// ==========================================
// HEALTH CHECK
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartLab Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==========================================
// ROOT ROUTE
// ==========================================
app.get("/", (req, res) => {
  res.json({
    message: "🏥 SmartLabo API is running",
    version: "2.0.0",
    status: "active",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      patients: "/api/patients",
      doctors: "/api/doctors",
      tasks: "/api/tasks",
      factures: "/api/factures",
      dashboard: "/api/dashboard",
      analyses: "/api/analyses",
      analyseTypes: "/api/analyse-types",
      appointments: "/api/appointments",
      chatbot: "/api/chatbot",
      aiAgent: "/api/ai-agent",
      // 🆕 Nouvelles routes
      medicalRecords: "/api/medical-records",
      patientAnalyses: "/api/patient-analyses",
      prescriptions: "/api/prescriptions",
      // 🆕 Espace patient
      patient: "/api/patient",
    },
    health: "/api/health",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    message: "❌ Route not found",
    requestedUrl: req.originalUrl,
    method: req.method,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log("=".repeat(50));
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, closing server gracefully...");
  server.close(() => {
    console.log("💤 Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received, closing server gracefully...");
  server.close(() => {
    console.log("💤 Server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

module.exports = app;
