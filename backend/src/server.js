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
// DOSSIER MÉDICAL
// ==========================================
app.use("/api/medical-records", require("./routes/medicalRecords"));
app.use("/api/patient-analyses", require("./routes/patientAnalyses"));
app.use("/api/prescriptions", require("./routes/prescriptions"));

// ==========================================
// 🆕 PATIENT PORTAL ROUTES
// ==========================================
app.use("/api/patient", require("./routes/patientAppointments"));

// ✨ NEW: NFC Management
app.use("/api/patient/nfc", require("./routes/patient/nfc"));

// ==========================================
// 🆕 PUBLIC NFC ROUTES (No Auth Required)
// ==========================================
const Patient = require("./models/Patient");
const NFCScan = require("./models/NFCScan");

// Verify NFC Card (Public)
app.get("/api/nfc/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    console.log("🔍 NFC Verification:", token.slice(0, 8) + "...");

    const patient = await Patient.findByNFCToken(token);

    if (!patient) {
      console.log("❌ Invalid or expired token");
      return res.status(404).json({
        success: false,
        message: "Carte non reconnue ou expirée",
      });
    }

    if (patient.nfc.status !== "active") {
      console.log("❌ Card status:", patient.nfc.status);
      return res.status(403).json({
        success: false,
        message: `Carte ${patient.nfc.status}`,
      });
    }

    // Log scan
    const scan = new NFCScan({
      patient: patient._id,
      cardNumber: patient.nfc.cardNumber,
      scanType: "web",
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection.remoteAddress,
      },
      successful: true,
    });
    await scan.save();

    // Update last scanned
    patient.nfc.lastScanned = {
      date: new Date(),
      location: "Web Scanner",
      scannedBy: "Anonymous",
    };
    await patient.save();

    const publicInfo = patient.getPublicInfo();

    console.log("✅ Verification successful:", patient.numeroPatient);

    res.json({
      success: true,
      data: publicInfo,
    });
  } catch (error) {
    console.error("❌ NFC Verify error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
    });
  }
});

// Log NFC Scan (Public)
app.post("/api/nfc/scan/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { scannedBy, location, purpose, isEmergency } = req.body;

    const patient = await Patient.findByNFCToken(token);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Carte non reconnue",
      });
    }

    const scan = new NFCScan({
      patient: patient._id,
      cardNumber: patient.nfc.cardNumber,
      scanType: req.body.scanType || "web",
      scannedBy,
      location,
      purpose,
      deviceInfo: {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip || req.connection.remoteAddress,
      },
      isEmergency: isEmergency || false,
      successful: true,
    });

    await scan.save();

    if (location?.address) {
      patient.nfc.lastScanned = {
        date: new Date(),
        location: location.address,
        scannedBy: scannedBy?.name || "Unknown",
      };
      await patient.save();
    }

    console.log("📝 Scan logged:", patient.numeroPatient);

    res.json({
      success: true,
      message: "Scan enregistré",
    });
  } catch (error) {
    console.error("❌ Scan log error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement",
    });
  }
});

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
    message: "SmartLabo Server is running",
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
    version: "2.2.0",
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
      medicalRecords: "/api/medical-records",
      patientAnalyses: "/api/patient-analyses",
      prescriptions: "/api/prescriptions",

      // 🆕 Patient Portal
      patientPortal: {
        appointments: "/api/patient/appointments",
        profile: "/api/patient/profile",
        dashboard: "/api/patient/dashboard/stats",
        analyses: "/api/patient/analyses",
        invoices: "/api/patient/invoices",
        nfc: "/api/patient/nfc",
      },

      // 🆕 Public NFC
      nfc: {
        verify: "/api/nfc/verify/:token",
        scan: "/api/nfc/scan/:token",
      },
    },
    health: "/api/health",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
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
    success: false,
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`✅ SmartLabo Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log("=".repeat(60));
  console.log("📋 New Routes:");
  console.log("   💳 NFC System:");
  console.log("      GET    /api/patient/nfc (Get card)");
  console.log("      POST   /api/patient/nfc/generate (Generate)");
  console.log("      GET    /api/patient/nfc/scan-history");
  console.log("      POST   /api/patient/nfc/report-lost");
  console.log("   ");
  console.log("   🌐 Public NFC:");
  console.log("      GET    /api/nfc/verify/:token (Public)");
  console.log("      POST   /api/nfc/scan/:token (Public)");
  console.log("=".repeat(60));
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
