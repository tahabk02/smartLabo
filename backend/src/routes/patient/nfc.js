// ==========================================
// backend/routes/patient/nfc.js
// ==========================================
const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const { protect, authorize } = require("../../middleware/authMiddleware");
const Patient = require("../../models/Patient");
const NFCScan = require("../../models/NFCScan");

// ========================================
// @route   GET /api/patient/nfc
// @desc    Get my NFC card info
// @access  Private (Patient)
// ========================================
router.get("/", protect, authorize("patient"), async (req, res) => {
  try {
    // Find patient by user ID
    const patient = await Patient.findOne({ user: req.user.id }).select(
      "nfc numeroPatient firstName lastName"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profil patient introuvable",
      });
    }

    if (patient.nfc.status === "not_issued") {
      return res.status(404).json({
        success: false,
        message: "Vous n'avez pas encore de carte NFC",
        canGenerate: true,
      });
    }

    res.json({
      success: true,
      data: {
        cardNumber: patient.nfc.cardNumber,
        status: patient.nfc.status,
        issuedAt: patient.nfc.issuedAt,
        expiresAt: patient.nfc.expiresAt,
        qrCode: patient.nfc.qrCode,
        lastScanned: patient.nfc.lastScanned,
      },
    });
  } catch (error) {
    console.error("Get NFC card error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de la carte",
    });
  }
});

// ========================================
// @route   POST /api/patient/nfc/generate
// @desc    Generate new NFC card
// @access  Private (Patient)
// ========================================
router.post("/generate", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profil patient introuvable",
      });
    }

    // Check if already has active card
    if (patient.nfc.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà une carte NFC active",
        data: {
          cardNumber: patient.nfc.cardNumber,
          status: patient.nfc.status,
        },
      });
    }

    // Generate card number and token
    const cardNumber = patient.generateCardNumber();
    const token = patient.generateNFCToken();

    // Generate QR Code
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const qrCodeUrl = `${baseUrl}/nfc/${token}`;

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    patient.nfc.qrCode = qrCodeDataURL;

    await patient.save();

    console.log("✅ NFC Card generated:", {
      patient: patient.numeroPatient,
      cardNumber: patient.nfc.cardNumber,
    });

    res.json({
      success: true,
      message: "Carte NFC générée avec succès",
      data: {
        cardNumber: patient.nfc.cardNumber,
        qrCode: qrCodeDataURL,
        expiresAt: patient.nfc.expiresAt,
        url: qrCodeUrl,
      },
    });
  } catch (error) {
    console.error("Generate NFC error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération de la carte",
      error: error.message,
    });
  }
});

// ========================================
// @route   GET /api/patient/nfc/scan-history
// @desc    Get my NFC scan history
// @access  Private (Patient)
// ========================================
router.get("/scan-history", protect, authorize("patient"), async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profil patient introuvable",
      });
    }

    const scans = await NFCScan.find({ patient: patient._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await NFCScan.countDocuments({ patient: patient._id });

    res.json({
      success: true,
      data: {
        scans,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get scan history error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de l'historique",
    });
  }
});

// ========================================
// @route   POST /api/patient/nfc/report-lost
// @desc    Report NFC card as lost
// @access  Private (Patient)
// ========================================
router.post("/report-lost", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Profil patient introuvable",
      });
    }

    if (patient.nfc.status === "not_issued") {
      return res.status(404).json({
        success: false,
        message: "Aucune carte à signaler",
      });
    }

    await patient.reportNFCLost();

    console.log("⚠️ NFC Card reported lost:", patient.numeroPatient);

    res.json({
      success: true,
      message:
        "Carte signalée comme perdue. Vous pouvez en demander une nouvelle.",
    });
  } catch (error) {
    console.error("Report lost error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du signalement",
    });
  }
});

// ========================================
// @route   GET /api/patient/nfc/qrcode
// @desc    Get QR code only
// @access  Private (Patient)
// ========================================
router.get("/qrcode", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).select("nfc");

    if (!patient || !patient.nfc.qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR Code non disponible",
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: patient.nfc.qrCode,
        cardNumber: patient.nfc.cardNumber,
        status: patient.nfc.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du QR Code",
    });
  }
});

module.exports = router;

// ==========================================
// PUBLIC NFC VERIFICATION ROUTES
// (Add to server.js or create separate route file)
// ==========================================

/*
// Add these to your server.js:

const Patient = require("./models/Patient");
const NFCScan = require("./models/NFCScan");

// ========================================
// @route   GET /api/nfc/verify/:token
// @desc    Verify NFC card (PUBLIC)
// @access  Public
// ========================================
app.get("/api/nfc/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log("🔍 NFC Verification request for token:", token.slice(0, 8) + "...");

    // Find patient by NFC token
    const patient = await Patient.findByNFCToken(token);

    if (!patient) {
      console.log("❌ Invalid or expired NFC token");
      return res.status(404).json({
        success: false,
        message: "Carte non reconnue ou expirée",
      });
    }

    if (patient.nfc.status !== "active") {
      console.log("❌ NFC card status:", patient.nfc.status);
      return res.status(403).json({
        success: false,
        message: `Carte ${patient.nfc.status}`,
      });
    }

    // Log the scan
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

    // Update last scanned info
    patient.nfc.lastScanned = {
      date: new Date(),
      location: "Web Scanner",
      scannedBy: "Anonymous",
    };
    await patient.save();

    // Get public info
    const publicInfo = patient.getPublicInfo();

    console.log("✅ NFC Verification successful:", patient.numeroPatient);

    res.json({
      success: true,
      data: publicInfo,
    });
  } catch (error) {
    console.error("❌ NFC Verify error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de la carte",
    });
  }
});

// ========================================
// @route   POST /api/nfc/scan/:token
// @desc    Log NFC scan with details (PUBLIC)
// @access  Public
// ========================================
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

    // Create detailed scan record
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

    // Update patient's last scan info
    if (location?.address) {
      patient.nfc.lastScanned = {
        date: new Date(),
        location: location.address,
        scannedBy: scannedBy?.name || "Unknown",
      };
      await patient.save();
    }

    console.log("📝 NFC Scan logged:", {
      patient: patient.numeroPatient,
      location: location?.address,
      emergency: isEmergency,
    });

    res.json({
      success: true,
      message: "Scan enregistré avec succès",
    });
  } catch (error) {
    console.error("❌ NFC Scan log error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du scan",
    });
  }
});
*/
