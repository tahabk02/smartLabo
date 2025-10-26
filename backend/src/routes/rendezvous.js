const express = require("express");
const router = express.Router();
const RendezVous = require("../models/RendezVous");
const Analysis = require("../models/Analysis");
const Patient = require("../models/Patient");
const Facture = require("../models/Facture");
const { protect, authorize } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// ==========================================
// 🎯 ROUTES SPÉCIALES (AVANT les routes avec paramètres)
// ==========================================

/**
 * @route   GET /api/rendezvous/available-slots
 * @desc    Get available time slots for appointments
 * @access  Private
 */
router.get("/available-slots", protect, async (req, res) => {
  try {
    const availableSlots = generateAvailableSlots();
    res.json(availableSlots);
  } catch (error) {
    console.error("❌ Error fetching available slots:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/rendezvous/analyses
 * @desc    Get available analyses for appointment booking
 * @access  Private
 */
router.get("/analyses", protect, async (req, res) => {
  try {
    const analyses = await Analysis.find({ status: "active" })
      .select("name category price code description")
      .sort({ category: 1, name: 1 });

    res.json(analyses);
  } catch (error) {
    console.error("❌ Error fetching analyses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 🎯 MIDDLEWARE pour valider les ObjectId
// ==========================================
const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  // Si c'est une route spéciale, passer à la suivante
  if (["available-slots", "analyses"].includes(id)) {
    return next("route");
  }

  // Vérifier si c'est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID de rendez-vous invalide" });
  }

  next();
};

// ==========================================
// 📋 ROUTES CRUD
// ==========================================

/**
 * @route   POST /api/rendezvous
 * @desc    Create a new appointment with invoice
 * @access  Private (Patient)
 */
router.post("/", protect, authorize("patient"), async (req, res) => {
  try {
    const { date, analyses, notes } = req.body;

    console.log("📝 [CREATE RDV] Creating appointment for user:", req.user._id);

    // Trouver le patient lié à cet utilisateur
    let patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {
      patient = await Patient.findOne({ userId: req.user._id });
    }

    if (!patient) {
      patient = await Patient.findOne({ email: req.user.email });
    }

    if (!patient) {
      return res.status(404).json({
        message:
          "Profil patient introuvable. Veuillez contacter l'administration.",
      });
    }

    console.log("✅ [CREATE RDV] Patient found:", patient._id);

    // Récupérer les analyses sélectionnées
    const selectedAnalyses = await Analysis.find({
      _id: { $in: analyses },
    });

    if (selectedAnalyses.length === 0) {
      return res.status(400).json({
        message: "Aucune analyse valide sélectionnée",
      });
    }

    // Calculer le montant total
    const totalAmount = selectedAnalyses.reduce(
      (sum, analysis) => sum + (analysis.price || 0),
      0
    );

    // Créer le rendez-vous
    const rdv = await RendezVous.create({
      patient: patient._id,
      dateRdv: date,
      analyses: analyses,
      notes: notes || "",
      totalAmount: totalAmount,
      statut: "pending",
      createdBy: req.user._id,
    });

    // Créer automatiquement la facture
    const factureNumber = await generateInvoiceNumber();

    const facture = await Facture.create({
      numeroFacture: factureNumber,
      patient: patient._id,
      patientId: patient._id,
      dateFacture: new Date(),
      montantTotal: totalAmount,
      statusPaiement: "pending",
      statut: "pending",
      items: selectedAnalyses.map((analysis) => ({
        description: analysis.name,
        quantity: 1,
        unitPrice: analysis.price,
        total: analysis.price,
      })),
      analyseIds: analyses,
      rendezvousId: rdv._id,
      notes: `Facture générée automatiquement pour RDV du ${new Date(
        date
      ).toLocaleDateString("fr-FR")}`,
    });

    // Lier la facture au rendez-vous
    rdv.factureId = facture._id; // ✅ Utiliser factureId au lieu de facture
    await rdv.save();

    // Populer les données pour la réponse
    const populatedRdv = await RendezVous.findById(rdv._id)
      .populate("analyses", "name category price")
      .populate("patient", "nom prenom email numeroPatient");

    console.log("✅ [CREATE RDV] Appointment and invoice created successfully");

    res.status(201).json({
      message: "Rendez-vous créé avec succès",
      appointment: {
        _id: populatedRdv._id,
        date: populatedRdv.dateRdv,
        status: populatedRdv.statut,
        analyses: populatedRdv.analyses,
        totalAmount: populatedRdv.totalAmount,
        notes: populatedRdv.notes,
        invoiceId: facture._id,
        invoiceNumber: facture.numeroFacture,
      },
      invoice: {
        _id: facture._id,
        invoiceNumber: facture.numeroFacture,
        totalAmount: facture.montantTotal,
        status: facture.statut,
      },
    });
  } catch (error) {
    console.error("❌ [CREATE RDV] Error:", error);
    res.status(500).json({
      message: "Erreur lors de la création du rendez-vous",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/rendezvous
 * @desc    Get all appointments
 * @access  Private
 */
router.get("/", protect, async (req, res) => {
  try {
    console.log("📋 [GET RDV] User:", req.user._id, "Role:", req.user.role);

    let appointments;

    if (["admin", "receptionist", "doctor"].includes(req.user.role)) {
      // Admin/Staff : tous les rendez-vous
      appointments = await RendezVous.find()
        .populate("patient", "nom prenom email telephone numeroPatient")
        .populate("analyses", "name category price code")
        .sort({ dateRdv: -1 });
    } else {
      // Patient : seulement ses rendez-vous
      const patient =
        (await Patient.findOne({ user: req.user._id })) ||
        (await Patient.findOne({ userId: req.user._id })) ||
        (await Patient.findOne({ email: req.user.email }));

      if (!patient) {
        console.log("⚠️ [GET RDV] No patient found, returning empty array");
        return res.json([]);
      }

      console.log("✅ [GET RDV] Found patient:", patient._id);

      appointments = await RendezVous.find({ patient: patient._id })
        .populate("analyses", "name category price code")
        .sort({ dateRdv: -1 });

      console.log(
        `✅ [GET RDV] Found ${appointments.length} appointments for patient`
      );
    }

    // Transformer pour le frontend
    const transformedAppointments = appointments.map((apt) => ({
      _id: apt._id,
      date: apt.dateRdv,
      status: apt.statut,
      patient: apt.patient
        ? {
            _id: apt.patient._id,
            name:
              `${apt.patient.nom || ""} ${apt.patient.prenom || ""}`.trim() ||
              "Patient inconnu",
            nom: apt.patient.nom,
            prenom: apt.patient.prenom,
            email: apt.patient.email,
            phone: apt.patient.telephone,
            numeroPatient: apt.patient.numeroPatient,
          }
        : null,
      analyses: apt.analyses || [],
      notes: apt.notes,
      totalAmount: apt.totalAmount || 0,
      invoiceId: apt.factureId, // ✅ Changer de facture._id à factureId
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
    }));

    console.log(
      `✅ [GET RDV] Returning ${transformedAppointments.length} appointment(s)`
    );

    res.json(transformedAppointments);
  } catch (error) {
    console.error("❌ [GET RDV] Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/rendezvous/:id
 * @desc    Get single appointment
 * @access  Private
 */
router.get("/:id", validateObjectId, protect, async (req, res) => {
  try {
    const appointment = await RendezVous.findById(req.params.id)
      .populate("patient", "nom prenom email telephone numeroPatient")
      .populate("analyses", "name category price code");

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifier les permissions
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user: req.user._id });
      if (
        !patient ||
        appointment.patient._id.toString() !== patient._id.toString()
      ) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }
    }

    // Transformer pour le frontend
    const transformed = {
      _id: appointment._id,
      date: appointment.dateRdv,
      status: appointment.statut,
      patient: {
        _id: appointment.patient._id,
        name: `${appointment.patient.nom} ${appointment.patient.prenom}`,
        nom: appointment.patient.nom,
        prenom: appointment.patient.prenom,
        email: appointment.patient.email,
        phone: appointment.patient.telephone,
      },
      analyses: appointment.analyses || [],
      notes: appointment.notes,
      totalAmount: appointment.totalAmount || 0,
      invoiceId: appointment.factureId,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };

    res.json(transformed);
  } catch (error) {
    console.error("❌ Error fetching appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// 🎯 ROUTES DE GESTION DU STATUT
// ==========================================

/**
 * @route   PATCH /api/rendezvous/:id/confirm
 * @desc    Confirm an appointment
 * @access  Private (Admin, Receptionist)
 */
router.patch(
  "/:id/confirm",
  validateObjectId,
  protect,
  authorize("admin", "receptionist", "doctor"),
  async (req, res) => {
    try {
      const appointment = await RendezVous.findById(req.params.id)
        .populate("patient", "nom prenom email telephone numeroPatient")
        .populate("analyses", "name category price");

      if (!appointment) {
        return res.status(404).json({ message: "Rendez-vous non trouvé" });
      }

      if (appointment.statut === "cancelled") {
        return res.status(400).json({
          message: "Impossible de confirmer un rendez-vous annulé",
        });
      }

      appointment.statut = "confirmed";
      appointment.updatedBy = req.user._id;
      await appointment.save();

      console.log("✅ [CONFIRM RDV] Appointment confirmed:", appointment._id);

      res.json({
        message: "Rendez-vous confirmé avec succès",
        appointment: {
          _id: appointment._id,
          date: appointment.dateRdv,
          status: appointment.statut,
          patient: {
            _id: appointment.patient._id,
            name: `${appointment.patient.nom} ${appointment.patient.prenom}`,
            nom: appointment.patient.nom,
            prenom: appointment.patient.prenom,
            email: appointment.patient.email,
          },
          analyses: appointment.analyses,
          totalAmount: appointment.totalAmount,
        },
      });
    } catch (error) {
      console.error("❌ [CONFIRM RDV] Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @route   PATCH /api/rendezvous/:id/cancel
 * @desc    Cancel an appointment
 * @access  Private
 */
router.patch("/:id/cancel", validateObjectId, protect, async (req, res) => {
  try {
    const appointment = await RendezVous.findById(req.params.id).populate(
      "patient",
      "nom prenom email"
    );

    if (!appointment) {
      return res.status(404).json({ message: "Rendez-vous non trouvé" });
    }

    // Vérifier les permissions
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ user: req.user._id });
      if (
        !patient ||
        appointment.patient._id.toString() !== patient._id.toString()
      ) {
        return res.status(403).json({ message: "Accès non autorisé" });
      }
    }

    if (["cancelled", "completed"].includes(appointment.statut)) {
      return res.status(400).json({
        message: `Impossible d'annuler un rendez-vous ${appointment.statut}`,
      });
    }

    appointment.statut = "cancelled";
    appointment.updatedBy = req.user._id;
    await appointment.save();

    console.log("✅ [CANCEL RDV] Appointment cancelled:", appointment._id);

    res.json({
      message: "Rendez-vous annulé avec succès",
      appointment: {
        _id: appointment._id,
        date: appointment.dateRdv,
        status: appointment.statut,
      },
    });
  } catch (error) {
    console.error("❌ [CANCEL RDV] Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PATCH /api/rendezvous/:id/complete
 * @desc    Mark appointment as completed
 * @access  Private (Admin, Doctor)
 */
router.patch(
  "/:id/complete",
  validateObjectId,
  protect,
  authorize("admin", "doctor", "lab_tech"),
  async (req, res) => {
    try {
      const appointment = await RendezVous.findById(req.params.id)
        .populate("patient", "nom prenom email")
        .populate("analyses", "name category price");

      if (!appointment) {
        return res.status(404).json({ message: "Rendez-vous non trouvé" });
      }

      if (appointment.statut === "cancelled") {
        return res.status(400).json({
          message: "Impossible de compléter un rendez-vous annulé",
        });
      }

      appointment.statut = "completed";
      appointment.updatedBy = req.user._id;
      await appointment.save();

      console.log("✅ [COMPLETE RDV] Appointment completed:", appointment._id);

      res.json({
        message: "Rendez-vous marqué comme terminé",
        appointment: {
          _id: appointment._id,
          date: appointment.dateRdv,
          status: appointment.statut,
          patient: {
            _id: appointment.patient._id,
            name: `${appointment.patient.nom} ${appointment.patient.prenom}`,
          },
          analyses: appointment.analyses,
        },
      });
    } catch (error) {
      console.error("❌ [COMPLETE RDV] Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * @route   PATCH /api/rendezvous/:id/status
 * @desc    Update appointment status (generic)
 * @access  Private (Admin/Doctor)
 */
router.patch(
  "/:id/status",
  validateObjectId,
  protect,
  authorize("admin", "doctor", "receptionist"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      const appointment = await RendezVous.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Rendez-vous non trouvé" });
      }

      appointment.statut = status;
      appointment.updatedBy = req.user._id;
      await appointment.save();

      console.log("✅ [UPDATE STATUS] Status updated to:", status);

      res.json({ message: "Statut mis à jour", appointment });
    } catch (error) {
      console.error("❌ [UPDATE STATUS] Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Générer les créneaux disponibles
 */
function generateAvailableSlots() {
  const slots = [];
  const startDate = new Date();

  for (let i = 1; i <= 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Ignorer les weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // Créneaux de 9h à 17h par intervalles de 30 minutes
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);

        if (slotTime > new Date()) {
          slots.push(slotTime.toISOString());
        }
      }
    }
  }

  return slots;
}

/**
 * Générer un numéro de facture unique
 */
async function generateInvoiceNumber() {
  const count = await Facture.countDocuments();
  return `FAC${String(count + 1).padStart(6, "0")}`;
}

module.exports = router;
