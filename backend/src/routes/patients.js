const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Facture = require("../models/Facture");
const Appointment = require("../models/Appointment");
const { protect, authorize } = require("../middleware/authMiddleware");

// ========================================
// ROUTES ADMIN/RECEPTIONIST (existantes)
// ========================================

// ----------------------------
// @route   GET /api/patients
// @desc    Get all patients
// @access  Private
// ----------------------------
router.get("/", protect, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------
// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
// ----------------------------
router.get("/:id", protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------
// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (admin, receptionist)
// ----------------------------
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const count = await Patient.countDocuments();
      const numeroPatient = `PAT${String(count + 1).padStart(6, "0")}`;

      const patient = new Patient({
        ...req.body,
        numeroPatient,
      });

      await patient.save();
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (admin, receptionist)
// ----------------------------
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (admin only)
// ----------------------------
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ========================================
// ✅ NOUVELLES ROUTES PATIENT (Dashboard)
// ========================================

// ----------------------------
// @route   GET /api/patients/invoices
// @desc    Get invoices for current patient
// @access  Private (patient only)
// ----------------------------
router.get("/invoices", protect, async (req, res) => {
  try {
    console.log("📋 Récupération des factures pour le patient:", req.user.id);

    // Récupérer les factures du patient connecté
    const invoices = await Invoice.find({ patientId: req.user.id })
      .populate("appointmentId", "date time status")
      .sort({ issueDate: -1 })
      .lean();

    console.log(`✅ ${invoices.length} facture(s) trouvée(s)`);

    res.json(invoices);
  } catch (error) {
    console.error("❌ Erreur récupération factures:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des factures",
      error: error.message,
    });
  }
});

// ----------------------------
// @route   GET /api/patients/appointments
// @desc    Get appointments for current patient
// @access  Private (patient only)
// ----------------------------
router.get("/appointments", protect, async (req, res) => {
  try {
    console.log("📅 Récupération des rendez-vous pour:", req.user.id);

    const appointments = await Appointment.find({ patientId: req.user.id })
      .sort({ date: -1 })
      .lean();

    console.log(`✅ ${appointments.length} rendez-vous trouvé(s)`);

    res.json(appointments);
  } catch (error) {
    console.error("❌ Erreur récupération rendez-vous:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des rendez-vous",
      error: error.message,
    });
  }
});

// ----------------------------
// @route   GET /api/patients/profile
// @desc    Get current patient profile
// @access  Private (patient only)
// ----------------------------
router.get("/profile", protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id })
      .select("-__v")
      .lean();

    if (!patient) {
      return res.status(404).json({ message: "Profil patient non trouvé" });
    }

    res.json(patient);
  } catch (error) {
    console.error("❌ Erreur récupération profil:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du profil",
      error: error.message,
    });
  }
});

// ----------------------------
// @route   PUT /api/patients/profile
// @desc    Update current patient profile
// @access  Private (patient only)
// ----------------------------
router.put("/profile", protect, async (req, res) => {
  try {
    const { nom, prenom, telephone, adresse, email } = req.body;

    const patient = await Patient.findOne({ userId: req.user.id });

    if (!patient) {
      return res.status(404).json({ message: "Profil patient non trouvé" });
    }

    // Mise à jour des champs autorisés
    if (nom) patient.nom = nom;
    if (prenom) patient.prenom = prenom;
    if (telephone) patient.telephone = telephone;
    if (adresse) patient.adresse = adresse;
    if (email) patient.email = email;

    await patient.save();

    res.json({
      message: "Profil mis à jour avec succès",
      patient,
    });
  } catch (error) {
    console.error("❌ Erreur mise à jour profil:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour du profil",
      error: error.message,
    });
  }
});

module.exports = router;
