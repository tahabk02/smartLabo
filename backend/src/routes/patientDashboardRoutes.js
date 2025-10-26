// backend/routes/patientDashboardRoutes.js
// ✅ Routes consolidées pour l'espace patient

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const Facture = require("../models/Facture");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const PatientAnalysis = require("../models/PatientAnalysis");

// ========================================
// MIDDLEWARE: Récupérer le patient associé à l'utilisateur
// ========================================
const getPatientFromUser = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;

    console.log("🔍 [GET PATIENT] Searching for patient with userId:", userId);
    console.log("🔍 [GET PATIENT] User object:", {
      _id: req.user._id,
      id: req.user.id,
      role: req.user.role,
      email: req.user.email,
    });

    // Essayer différentes méthodes pour trouver le patient
    let patient = null;

    // Méthode 1: Chercher par champ "user" (si votre modèle Patient a un champ user)
    patient = await Patient.findOne({ user: userId });

    if (!patient) {
      console.log(
        "⚠️ [GET PATIENT] Not found by 'user' field, trying 'userId'..."
      );
      // Méthode 2: Chercher par champ "userId"
      patient = await Patient.findOne({ userId: userId });
    }

    if (!patient) {
      console.log(
        "⚠️ [GET PATIENT] Not found by 'userId', trying direct _id match..."
      );
      // Méthode 3: Si l'utilisateur EST le patient (req.user._id est directement l'ID du patient)
      patient = await Patient.findById(userId);
    }

    if (!patient) {
      console.error("❌ [GET PATIENT] Patient not found with any method");
      console.error("❌ [GET PATIENT] User ID used:", userId.toString());

      // Afficher tous les patients pour debug (à retirer en production)
      const allPatients = await Patient.find()
        .limit(5)
        .select("_id user userId email");
      console.log("🔍 [GET PATIENT] Sample of patients in DB:", allPatients);

      return res.status(404).json({
        success: false,
        message:
          "Profil patient introuvable. Veuillez contacter l'administration.",
        debug: {
          userId: userId.toString(),
          searchedFields: ["user", "userId", "_id"],
          userRole: req.user.role,
        },
      });
    }

    console.log("✅ [GET PATIENT] Patient found:", patient._id);
    req.patient = patient;
    next();
  } catch (error) {
    console.error("❌ [GET PATIENT] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message,
    });
  }
};

// ========================================
// FACTURES
// ========================================

/**
 * @route   GET /api/patient/invoices
 * @desc    Get invoices for current logged-in patient
 * @access  Private (Patient only)
 */
router.get("/invoices", protect, authorize("patient"), async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    console.log("📋 [PATIENT INVOICES] ===== DEBUG START =====");
    console.log("📋 [PATIENT INVOICES] User ID:", userId.toString());
    console.log("📋 [PATIENT INVOICES] User Role:", req.user.role);
    console.log("📋 [PATIENT INVOICES] User Email:", req.user.email);
    console.log("📋 [PATIENT INVOICES] User Name:", req.user.name);

    // Vérifier d'abord combien de factures existent en tout
    const totalFactures = await Facture.countDocuments();
    console.log(`📋 [PATIENT INVOICES] Total invoices in DB: ${totalFactures}`);

    if (totalFactures === 0) {
      console.log("⚠️ [PATIENT INVOICES] No invoices in database at all");
      return res.json([]);
    }

    // Afficher un échantillon de factures pour voir leur structure
    const sampleInvoices = await Facture.find().limit(3).lean();
    console.log(
      "📋 [PATIENT INVOICES] Sample invoice structure:",
      JSON.stringify(sampleInvoices[0], null, 2)
    );

    let factures = [];
    let foundMethod = null;

    // 🎯 MÉTHODE PRINCIPALE: Trouver le Patient lié à cet User
    console.log(
      "🔍 [PATIENT INVOICES] Step 1: Finding Patient document linked to User..."
    );

    // Chercher le patient lié à cet utilisateur
    let patient = await Patient.findOne({ user: userId });

    if (!patient) {
      console.log(
        "⚠️ [PATIENT INVOICES] No patient with 'user' field, trying 'userId'..."
      );
      patient = await Patient.findOne({ userId: userId });
    }

    if (!patient) {
      console.log(
        "⚠️ [PATIENT INVOICES] No patient with 'userId' field, trying by email..."
      );
      patient = await Patient.findOne({ email: req.user.email });
    }

    if (patient) {
      console.log(`✅ [PATIENT INVOICES] Patient document found!`);
      console.log(`   Patient ID: ${patient._id}`);
      console.log(`   Patient Name: ${patient.nom} ${patient.prenom}`);
      console.log(`   Patient Number: ${patient.numeroPatient}`);

      // Maintenant chercher les factures avec cet ID patient
      console.log(
        "🔍 [PATIENT INVOICES] Step 2: Searching invoices for this patient..."
      );

      // Tentative 1: Chercher par patientId
      factures = await Facture.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .lean();

      if (factures.length > 0) {
        foundMethod = "patientId field";
        console.log(
          `✅ [PATIENT INVOICES] Found ${factures.length} invoice(s) using patientId`
        );
      }

      // Tentative 2: Si pas trouvé, essayer avec "patient"
      if (factures.length === 0) {
        factures = await Facture.find({ patient: patient._id })
          .sort({ createdAt: -1 })
          .lean();

        if (factures.length > 0) {
          foundMethod = "patient field";
          console.log(
            `✅ [PATIENT INVOICES] Found ${factures.length} invoice(s) using patient`
          );
        }
      }
    } else {
      console.error("❌ [PATIENT INVOICES] No Patient document found!");
      console.error(
        "❌ [PATIENT INVOICES] This user has no associated patient record."
      );
      console.error(
        "❌ [PATIENT INVOICES] Please create a Patient document with:"
      );
      console.error(`   - user: ${userId} (or)`);
      console.error(`   - userId: ${userId} (or)`);
      console.error(`   - email: ${req.user.email}`);

      // Afficher tous les patients pour debug
      const allPatients = await Patient.find()
        .select("_id user userId email nom prenom")
        .limit(5)
        .lean();
      console.log("📋 [PATIENT INVOICES] Sample patients in DB:", allPatients);

      return res.json({
        invoices: [],
        debug: {
          error: "No patient document linked to this user",
          userId: userId.toString(),
          userEmail: req.user.email,
          totalInvoicesInDB: totalFactures,
          samplePatients: allPatients.map((p) => ({
            id: p._id.toString(),
            user: p.user?.toString(),
            userId: p.userId?.toString(),
            email: p.email,
            name: `${p.nom} ${p.prenom}`,
          })),
        },
      });
    }

    console.log(
      `📋 [PATIENT INVOICES] Final result: ${factures.length} invoice(s) found`
    );
    console.log(`📋 [PATIENT INVOICES] Method used: ${foundMethod || "NONE"}`);
    console.log("📋 [PATIENT INVOICES] ===== DEBUG END =====");

    // Mapper les champs pour le frontend
    const mappedInvoices = factures.map((facture) => ({
      _id: facture._id,
      invoiceNumber: facture.numeroFacture || facture.invoiceNumber || "N/A",
      issueDate:
        facture.dateFacture ||
        facture.dateEmission ||
        facture.issueDate ||
        facture.createdAt,
      dueDate: facture.dateEcheance || facture.dueDate,
      status:
        facture.statusPaiement?.toLowerCase() === "payée" ||
        facture.statusPaiement?.toLowerCase() === "payé"
          ? "paid"
          : facture.statusPaiement?.toLowerCase() === "en attente"
          ? "pending"
          : facture.statusPaiement?.toLowerCase() === "en retard"
          ? "overdue"
          : facture.statut?.toLowerCase() === "payée"
          ? "paid"
          : facture.statut?.toLowerCase() === "en attente"
          ? "pending"
          : facture.status || "pending",
      totalAmount: facture.montantTotal || facture.totalAmount || 0,
      subtotal: facture.montantHT || facture.subtotal,
      taxAmount: facture.montantTVA || facture.taxAmount,
      items: facture.items || facture.lignes || [],
      appointmentId: facture.appointmentId || facture.rendezvousId,
      paidDate: facture.datePaiement || facture.paidDate,
      paymentMethod:
        facture.modePaiement ||
        facture.methodePaiement ||
        facture.paymentMethod,
      notes: facture.notes,
    }));

    res.json(mappedInvoices);
  } catch (error) {
    console.error("❌ [PATIENT INVOICES] Error:", error);
    console.error("❌ [PATIENT INVOICES] Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des factures",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/patient/invoices/:id
 * @desc    Get specific invoice for current patient
 * @access  Private (Patient only)
 */
router.get(
  "/invoices/:id",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      const patientId = req.patient._id;

      console.log(
        `📋 [PATIENT INVOICE DETAIL] Invoice ${req.params.id} for patient ${patientId}`
      );

      const facture = await Facture.findOne({
        _id: req.params.id,
        patient: patientId,
      })
        .populate("patient", "firstName lastName numeroPatient email phone")
        .lean();

      if (!facture) {
        console.log(
          "❌ [PATIENT INVOICE DETAIL] Invoice not found or unauthorized"
        );
        return res.status(404).json({
          success: false,
          message: "Facture non trouvée",
        });
      }

      // Mapper les champs
      const mappedInvoice = {
        _id: facture._id,
        invoiceNumber: facture.numeroFacture || facture.invoiceNumber || "N/A",
        issueDate:
          facture.dateFacture ||
          facture.dateEmission ||
          facture.issueDate ||
          facture.createdAt,
        dueDate: facture.dateEcheance || facture.dueDate,
        status:
          facture.statut?.toLowerCase() === "payée"
            ? "paid"
            : facture.statut?.toLowerCase() === "en attente"
            ? "pending"
            : facture.statut?.toLowerCase() === "en retard"
            ? "overdue"
            : facture.status || "pending",
        totalAmount: facture.montantTotal || facture.totalAmount || 0,
        subtotal: facture.montantHT || facture.subtotal,
        taxAmount: facture.montantTVA || facture.taxAmount,
        items: facture.items || facture.lignes || [],
        appointmentId: facture.appointmentId || facture.rendezvousId,
        paidDate: facture.datePaiement || facture.paidDate,
        paymentMethod: facture.methodePaiement || facture.paymentMethod,
        notes: facture.notes,
        patient: facture.patient,
      };

      console.log("✅ [PATIENT INVOICE DETAIL] Invoice found");
      res.json(mappedInvoice);
    } catch (error) {
      console.error("❌ [PATIENT INVOICE DETAIL] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la facture",
        error: error.message,
      });
    }
  }
);

// ========================================
// RENDEZ-VOUS
// ========================================

/**
 * @route   GET /api/patient/appointments
 * @desc    Get appointments for current patient
 * @access  Private (Patient only)
 */
router.get(
  "/appointments",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      const patientId = req.patient._id;

      console.log("📅 [PATIENT APPOINTMENTS] Fetching for patient:", patientId);

      const appointments = await Appointment.find({ patient: patientId })
        .populate("analyses", "name code price category")
        .sort({ date: -1 })
        .lean();

      console.log(
        `✅ [PATIENT APPOINTMENTS] Found ${appointments.length} appointment(s)`
      );

      res.json(appointments);
    } catch (error) {
      console.error("❌ [PATIENT APPOINTMENTS] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des rendez-vous",
        error: error.message,
      });
    }
  }
);

// ========================================
// ANALYSES
// ========================================

/**
 * @route   GET /api/patient/analyses/history
 * @desc    Get analysis history for current patient
 * @access  Private (Patient only)
 */
router.get(
  "/analyses/history",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      const patientId = req.patient._id;

      console.log(
        "🔬 [PATIENT ANALYSES] Fetching history for patient:",
        patientId
      );

      const analyses = await PatientAnalysis.find({ patient: patientId })
        .populate("analysisType", "name code category price")
        .populate("invoice", "numeroFacture montantTotal statut")
        .sort({ requestDate: -1 })
        .lean();

      console.log(`✅ [PATIENT ANALYSES] Found ${analyses.length} analysis/es`);

      res.json(analyses);
    } catch (error) {
      console.error("❌ [PATIENT ANALYSES] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de l'historique",
        error: error.message,
      });
    }
  }
);

// ========================================
// PROFIL
// ========================================

/**
 * @route   GET /api/patient/profile
 * @desc    Get current patient profile
 * @access  Private (Patient only)
 */
router.get(
  "/profile",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      console.log("👤 [PATIENT PROFILE] Fetching profile");

      res.json(req.patient);
    } catch (error) {
      console.error("❌ [PATIENT PROFILE] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération du profil",
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/patient/profile
 * @desc    Update current patient profile
 * @access  Private (Patient only)
 */
router.put(
  "/profile",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      console.log("📝 [PATIENT PROFILE UPDATE] Updating profile");

      // Champs autorisés à la modification par le patient
      const allowedFields = [
        "phone",
        "address",
        "city",
        "emergencyContact",
        "email",
      ];

      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const updatedPatient = await Patient.findByIdAndUpdate(
        req.patient._id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log("✅ [PATIENT PROFILE UPDATE] Profile updated");

      res.json({
        success: true,
        message: "Profil mis à jour avec succès",
        patient: updatedPatient,
      });
    } catch (error) {
      console.error("❌ [PATIENT PROFILE UPDATE] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du profil",
        error: error.message,
      });
    }
  }
);

// ========================================
// STATISTIQUES DASHBOARD
// ========================================

/**
 * @route   GET /api/patient/dashboard/stats
 * @desc    Get dashboard statistics for current patient
 * @access  Private (Patient only)
 */
router.get(
  "/dashboard/stats",
  protect,
  authorize("patient"),
  getPatientFromUser,
  async (req, res) => {
    try {
      const patientId = req.patient._id;

      console.log("📊 [PATIENT STATS] Fetching stats for patient:", patientId);

      // Statistiques des analyses
      const totalAnalyses = await PatientAnalysis.countDocuments({
        patient: patientId,
      });

      const pendingAnalyses = await PatientAnalysis.countDocuments({
        patient: patientId,
        status: { $in: ["pending", "sample_collected", "in_progress"] },
      });

      const completedAnalyses = await PatientAnalysis.countDocuments({
        patient: patientId,
        status: { $in: ["completed", "validated", "delivered"] },
      });

      // Statistiques des factures
      const totalFactures = await Facture.countDocuments({
        patient: patientId,
      });

      const unpaidFactures = await Facture.countDocuments({
        patient: patientId,
        statut: { $in: ["En attente", "En retard"] },
      });

      const paidFactures = await Facture.countDocuments({
        patient: patientId,
        statut: "Payée",
      });

      // Montant total des factures impayées
      const unpaidAmount = await Facture.aggregate([
        {
          $match: {
            patient: patientId,
            statut: { $in: ["En attente", "En retard"] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$montantTotal" },
          },
        },
      ]);

      // Rendez-vous à venir
      const upcomingAppointments = await Appointment.countDocuments({
        patient: patientId,
        date: { $gte: new Date() },
        status: { $in: ["pending", "confirmed"] },
      });

      console.log("✅ [PATIENT STATS] Stats calculated");

      res.json({
        analyses: {
          total: totalAnalyses,
          pending: pendingAnalyses,
          completed: completedAnalyses,
        },
        invoices: {
          total: totalFactures,
          unpaid: unpaidFactures,
          paid: paidFactures,
          unpaidAmount: unpaidAmount[0]?.total || 0,
        },
        appointments: {
          upcoming: upcomingAppointments,
        },
      });
    } catch (error) {
      console.error("❌ [PATIENT STATS] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  }
);

console.log("✅ patientDashboardRoutes.js loaded successfully");

module.exports = router;
