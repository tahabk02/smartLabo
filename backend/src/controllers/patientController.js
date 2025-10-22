// backend/controllers/patient.controller.js

const Patient = require("../models/Patient");
const NFCScan = require("../models/NFCScan");
const Analysis = require("../models/Analysis");
const Invoice = require("../models/Invoice");
const Appointment = require("../models/Appointment");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const crypto = require("crypto");

// ========== AUTHENTICATION ==========

// Register new patient
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      birthDate,
      gender,
      cin,
    } = req.body;

    // Check if email exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Create new patient
    const patient = new Patient({
      firstName,
      lastName,
      email,
      password,
      phone,
      birthDate,
      gender,
      cin,
    });

    await patient.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      data: {
        patient: {
          id: patient._id,
          numeroPatient: patient.numeroPatient,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
};

// Login patient
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find patient with password field
    const patient = await Patient.findOne({ email }).select("+password");

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Check if account is active
    if (!patient.isActive) {
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé",
      });
    }

    // Verify password
    const isPasswordValid = await patient.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Update last login
    patient.lastLogin = new Date();
    await patient.save();

    // Generate token
    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        patient: {
          id: patient._id,
          numeroPatient: patient.numeroPatient,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          hasNFCCard: patient.nfc.status === "active",
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { token: oldToken } = req.body;

    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.id);

    if (!patient || !patient.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Session invalide" });
    }

    const newToken = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    res.status(401).json({ success: false, message: "Token invalide" });
  }
};

// ========== PROFILE ==========

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id)
      .populate("prescribedBy", "firstName lastName speciality")
      .select("-password");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient non trouvé",
      });
    }

    res.json({
      success: true,
      data: patient,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du profil",
      error: error.message,
    });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, emergencyContact } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        address,
        emergencyContact,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: patient,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
};

// Update medical info
exports.updateMedicalInfo = async (req, res) => {
  try {
    const { medicalInfo } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,
      { medicalInfo },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      message: "Informations médicales mises à jour",
      data: patient.medicalInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
};

// ========== DASHBOARD ==========

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const patientId = req.user.id;

    // Get counts
    const [appointments, analyses, invoices] = await Promise.all([
      Appointment.find({ patient: patientId }),
      Analysis.find({ patient: patientId }),
      Invoice.find({ patient: patientId }),
    ]);

    // Calculate stats
    const stats = {
      appointments: {
        total: appointments.length,
        upcoming: appointments.filter(
          (a) => new Date(a.dateTime) > new Date() && a.status !== "cancelled"
        ).length,
        completed: appointments.filter((a) => a.status === "completed").length,
      },
      analyses: {
        total: analyses.length,
        pending: analyses.filter((a) => a.status === "pending").length,
        completed: analyses.filter((a) =>
          ["completed", "validated", "delivered"].includes(a.status)
        ).length,
      },
      invoices: {
        total: invoices.length,
        unpaid: invoices.filter((i) => i.statut !== "Payée").length,
        unpaidAmount: invoices
          .filter((i) => i.statut !== "Payée")
          .reduce((sum, inv) => sum + inv.montantTotal, 0),
      },
      recentAnalyses: analyses
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
        .slice(0, 5),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des statistiques",
      error: error.message,
    });
  }
};

// ========== NFC SYSTEM ==========

// Generate NFC Card
exports.generateNFCCard = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient non trouvé" });
    }

    // Check if already has active card
    if (patient.nfc.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Vous avez déjà une carte NFC active",
      });
    }

    // Generate card number and token
    const cardNumber = patient.generateCardNumber();
    const token = patient.generateNFCToken();

    // Generate QR Code
    const qrCodeUrl = `${process.env.FRONTEND_URL}/nfc/verify/${token}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl);
    patient.nfc.qrCode = qrCodeDataURL;

    await patient.save();

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
};

// Get NFC Card Info
exports.getNFCCard = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select(
      "nfc numeroPatient fullName"
    );

    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient non trouvé" });
    }

    if (patient.nfc.status === "not_issued") {
      return res.status(404).json({
        success: false,
        message: "Vous n'avez pas encore de carte NFC",
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
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de la carte",
      error: error.message,
    });
  }
};

// Verify NFC Token (PUBLIC)
exports.verifyNFCToken = async (req, res) => {
  try {
    const { token } = req.params;

    const patient = await Patient.findByNFCToken(token);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Carte non reconnue ou expirée",
      });
    }

    if (patient.nfc.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Carte ${patient.nfc.status}`,
      });
    }

    // Return public info only
    const publicInfo = patient.getPublicInfo();

    res.json({
      success: true,
      data: publicInfo,
    });
  } catch (error) {
    console.error("Verify NFC error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
      error: error.message,
    });
  }
};

// Log NFC Scan (PUBLIC)
exports.logNFCScan = async (req, res) => {
  try {
    const { token } = req.params;
    const { scannedBy, location, purpose, deviceInfo, isEmergency } = req.body;

    const patient = await Patient.findByNFCToken(token);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Carte non reconnue",
      });
    }

    // Create scan record
    const scan = new NFCScan({
      patient: patient._id,
      cardNumber: patient.nfc.cardNumber,
      scanType: req.body.scanType || "web",
      scannedBy,
      location,
      purpose,
      deviceInfo,
      isEmergency: isEmergency || false,
      successful: true,
    });

    await scan.save();

    // Update last scanned info
    patient.nfc.lastScanned = {
      date: new Date(),
      location: location?.address || "Unknown",
      scannedBy: scannedBy?.name || "Anonymous",
    };
    await patient.save();

    res.json({
      success: true,
      message: "Scan enregistré",
    });
  } catch (error) {
    console.error("Log scan error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du scan",
      error: error.message,
    });
  }
};

// Get NFC Scan History
exports.getNFCScanHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;

    const scans = await NFCScan.find({ patient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await NFCScan.countDocuments({ patient: req.user.id });

    res.json({
      success: true,
      data: {
        scans,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement de l'historique",
      error: error.message,
    });
  }
};

// Report NFC Lost
exports.reportNFCLost = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);

    if (!patient || patient.nfc.status === "not_issued") {
      return res.status(404).json({
        success: false,
        message: "Aucune carte à signaler",
      });
    }

    await patient.reportNFCLost();

    res.json({
      success: true,
      message:
        "Carte signalée comme perdue. Veuillez demander une nouvelle carte.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du signalement",
      error: error.message,
    });
  }
};

// Get QR Code
exports.getQRCode = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id).select("nfc");

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
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement du QR Code",
      error: error.message,
    });
  }
};

// ========== APPOINTMENTS ==========

// Get all appointments
exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("doctor", "firstName lastName speciality")
      .sort({ dateTime: -1 });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des rendez-vous",
      error: error.message,
    });
  }
};

// Get upcoming appointments
exports.getUpcomingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user.id,
      dateTime: { $gte: new Date() },
      status: { $ne: "cancelled" },
    })
      .populate("doctor", "firstName lastName speciality")
      .sort({ dateTime: 1 })
      .limit(5);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
};

// Book appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctor, dateTime, reason, notes } = req.body;

    const appointment = new Appointment({
      patient: req.user.id,
      doctor,
      dateTime,
      reason,
      notes,
      status: "pending",
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Rendez-vous réservé avec succès",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réservation",
      error: error.message,
    });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patient: req.user.id },
      { status: "cancelled", cancelledAt: new Date() },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous non trouvé",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous annulé",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'annulation",
      error: error.message,
    });
  }
};

// ========== ANALYSES ==========

// Get all analyses
exports.getAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find({ patient: req.user.id })
      .populate("analysisType")
      .populate("performedBy", "firstName lastName")
      .sort({ requestDate: -1 });

    res.json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des analyses",
      error: error.message,
    });
  }
};

// Get analysis results
exports.getAnalysisResults = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      patient: req.user.id,
    })
      .populate("analysisType")
      .populate("performedBy", "firstName lastName")
      .populate("validatedBy", "firstName lastName");

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Analyse non trouvée",
      });
    }

    if (!["completed", "validated", "delivered"].includes(analysis.status)) {
      return res.status(400).json({
        success: false,
        message: "Résultats pas encore disponibles",
      });
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des résultats",
      error: error.message,
    });
  }
};

// ========== INVOICES ==========

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ patient: req.user.id }).sort({
      dateFacture: -1,
    });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des factures",
      error: error.message,
    });
  }
};

// Get unpaid invoices
exports.getUnpaidInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({
      patient: req.user.id,
      statut: { $ne: "Payée" },
    }).sort({ dateFacture: -1 });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
};

// Get invoice details
exports.getInvoiceDetails = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      patient: req.user.id,
    }).populate("patient", "firstName lastName email phone numeroPatient");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée",
      });
    }

    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
};

// ========== HELPER FUNCTIONS ==========

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const patient = await Patient.findById(req.user.id).select("+password");

    const isValid = await patient.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel incorrect",
      });
    }

    patient.password = newPassword;
    await patient.save();

    res.json({
      success: true,
      message: "Mot de passe modifié avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
      error: error.message,
    });
  }
};

// Update preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { preferences } = req.body;

    const patient = await Patient.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true }
    );

    res.json({
      success: true,
      message: "Préférences mises à jour",
      data: patient.preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour",
      error: error.message,
    });
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    // TODO: Implement notifications system
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement",
      error: error.message,
    });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.json({
        success: true,
        message: "Si l'email existe, vous recevrez un lien de réinitialisation",
      });
    }

    // TODO: Send reset email

    res.json({
      success: true,
      message: "Email de réinitialisation envoyé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la demande",
      error: error.message,
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    // TODO: Implement password reset
    res.json({
      success: true,
      message: "Mot de passe réinitialisé",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation",
      error: error.message,
    });
  }
};

// Placeholder functions
exports.getAppointmentDetails = async (req, res) => {
  res.json({ success: true, data: {} });
};
exports.updateAppointment = async (req, res) => {
  res.json({ success: true, data: {} });
};
exports.getPendingAnalyses = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.getAnalysisDetails = async (req, res) => {
  res.json({ success: true, data: {} });
};
exports.downloadAnalysisReport = async (req, res) => {
  res.json({ success: true });
};
exports.getAnalysisHistory = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.downloadInvoice = async (req, res) => {
  res.json({ success: true });
};
exports.payInvoice = async (req, res) => {
  res.json({ success: true });
};
exports.requestNewNFCCard = async (req, res) => {
  res.json({ success: true });
};
exports.getMedicalRecords = async (req, res) => {
  res.json({ success: true, data: {} });
};
exports.getAllergies = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.addAllergy = async (req, res) => {
  res.json({ success: true });
};
exports.deleteAllergy = async (req, res) => {
  res.json({ success: true });
};
exports.getMedications = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.addMedication = async (req, res) => {
  res.json({ success: true });
};
exports.updateMedication = async (req, res) => {
  res.json({ success: true });
};
exports.deleteMedication = async (req, res) => {
  res.json({ success: true });
};
exports.getDocuments = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.uploadDocument = async (req, res) => {
  res.json({ success: true });
};
exports.downloadDocument = async (req, res) => {
  res.json({ success: true });
};
exports.deleteDocument = async (req, res) => {
  res.json({ success: true });
};
exports.getAllNotifications = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.markNotificationAsRead = async (req, res) => {
  res.json({ success: true });
};
exports.markAllNotificationsAsRead = async (req, res) => {
  res.json({ success: true });
};
exports.deleteNotification = async (req, res) => {
  res.json({ success: true });
};
exports.contactSupport = async (req, res) => {
  res.json({ success: true });
};
exports.getFAQs = async (req, res) => {
  res.json({ success: true, data: [] });
};
exports.uploadPhoto = async (req, res) => {
  res.json({ success: true });
};
exports.getRecentActivity = async (req, res) => {
  res.json({ success: true, data: [] });
};
