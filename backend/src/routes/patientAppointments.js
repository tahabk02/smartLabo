const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const PatientAnalysis = require("../models/PatientAnalysis");
const Analysis = require("../models/Analysis");
const Facture = require("../models/Facture");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// ==========================================
// @route   GET /api/patient/analyses/catalog
// @desc    Get catalogue des analyses disponibles
// @access  Private (Patient)
// ==========================================
router.get(
  "/analyses/catalog",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const { category, search } = req.query;

      let filter = { isActive: true };

      if (category && category !== "all") {
        filter.category = category;
      }

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
        ];
      }

      const analyses = await Analysis.find(filter).sort({ name: 1 });

      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses catalog:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// ==========================================
// @route   GET /api/patient/doctors
// @desc    Get liste des médecins disponibles
// @access  Private (Patient)
// ==========================================
router.get("/doctors", protect, authorize("patient"), async (req, res) => {
  try {
    const { specialization, search } = req.query;

    let filter = { isActive: true };

    if (specialization && specialization !== "all") {
      filter.specialization = specialization;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    const doctors = await Doctor.find(filter)
      .select("name specialization phone email photo")
      .sort({ name: 1 });

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   GET /api/patient/doctors/:id
// @desc    Get détails d'un médecin
// @access  Private (Patient)
// ==========================================
router.get("/doctors/:id", protect, authorize("patient"), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      _id: req.params.id,
      isActive: true,
    }).select("name specialization phone email photo");

    if (!doctor) {
      return res.status(404).json({
        message: "Médecin introuvable",
      });
    }

    res.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   POST /api/patient/appointments/request
// @desc    Demander un rendez-vous avec analyses
// @access  Private (Patient)
// ==========================================
router.post(
  "/appointments/request",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const { analysisIds, preferredDate, notes } = req.body;

      console.log("📋 Appointment request:", {
        analysisIds,
        preferredDate,
        userId: req.user.id,
      });

      // Trouver le patient lié à cet utilisateur
      const patient = await Patient.findOne({ user: req.user.id });

      if (!patient) {
        return res.status(404).json({
          message:
            "Profil patient introuvable. Veuillez contacter l'administration.",
        });
      }

      // Valider les analyses sélectionnées
      if (!analysisIds || analysisIds.length === 0) {
        return res.status(400).json({
          message: "Veuillez sélectionner au moins une analyse",
        });
      }

      // Récupérer les détails des analyses
      const analyses = await Analysis.find({
        _id: { $in: analysisIds },
        isActive: true,
      });

      if (analyses.length === 0) {
        return res.status(404).json({
          message: "Aucune analyse valide trouvée",
        });
      }

      // Calculer le montant total
      const totalAmount = analyses.reduce(
        (sum, analysis) => sum + analysis.price,
        0
      );

      // Créer les demandes d'analyses
      const patientAnalyses = [];
      for (const analysis of analyses) {
        const patientAnalysis = await PatientAnalysis.create({
          patient: patient._id,
          analysisType: analysis._id,
          requestDate: new Date(),
          status: "pending",
          price: analysis.price,
          paid: false,
          isUrgent: false,
          internalNotes: notes || "",
          createdBy: req.user.id,
        });
        patientAnalyses.push(patientAnalysis);
      }

      // Créer la facture automatiquement
      const factureItems = analyses.map((analysis) => ({
        description: analysis.name,
        quantity: 1,
        unitPrice: analysis.price,
        total: analysis.price,
        analysis: analysis._id,
      }));

      const facture = await Facture.create({
        patient: patient._id,
        dateFacture: new Date(),
        montantTotal: totalAmount,
        items: factureItems,
        statut: "En attente",
        notes: notes || "",
        createdBy: req.user.id,
      });

      // Lier la facture aux analyses
      for (const patientAnalysis of patientAnalyses) {
        patientAnalysis.invoice = facture._id;
        await patientAnalysis.save();
      }

      console.log("✅ Appointment created:", {
        analyses: patientAnalyses.length,
        factureId: facture._id,
      });

      res.status(201).json({
        message: "Rendez-vous créé avec succès",
        appointment: {
          analyses: patientAnalyses,
          facture: facture,
          totalAmount,
          analysisCount: analyses.length,
        },
      });
    } catch (error) {
      console.error("❌ Error creating appointment:", error);
      res.status(500).json({
        message: "Erreur lors de la création du rendez-vous",
        error: error.message,
      });
    }
  }
);

// ==========================================
// @route   GET /api/patient/appointments
// @desc    Get mes rendez-vous et analyses
// @access  Private (Patient)
// ==========================================
router.get("/appointments", protect, authorize("patient"), async (req, res) => {
  try {
    // Trouver le patient
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        message: "Profil patient introuvable",
      });
    }

    // Récupérer toutes les analyses du patient
    const analyses = await PatientAnalysis.find({ patient: patient._id })
      .populate("analysisType", "name code category price")
      .populate("invoice", "numeroFacture montantTotal statut")
      .populate("prescribedBy", "name")
      .populate("performedBy", "name")
      .populate("validatedBy", "name")
      .sort({ requestDate: -1 });

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   GET /api/patient/invoices
// @desc    Get mes factures
// @access  Private (Patient)
// ==========================================
router.get("/invoices", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        message: "Profil patient introuvable",
      });
    }

    // Récupérer toutes les factures du patient
    const factures = await Facture.find({ patient: patient._id }).sort({
      createdAt: -1,
    });

    res.json(factures);
  } catch (error) {
    console.error("Error fetching patient invoices:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   GET /api/patient/invoices/:id
// @desc    Get détails d'une facture
// @access  Private (Patient)
// ==========================================
router.get("/invoices/:id", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        message: "Profil patient introuvable",
      });
    }

    const facture = await Facture.findOne({
      _id: req.params.id,
      patient: patient._id,
    }).populate("patient", "firstName lastName numeroPatient email phone");

    if (!facture) {
      return res.status(404).json({
        message: "Facture introuvable",
      });
    }

    res.json(facture);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   GET /api/patient/analyses/:id/results
// @desc    Get résultats d'une analyse
// @access  Private (Patient)
// ==========================================
router.get(
  "/analyses/:id/results",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const patient = await Patient.findOne({ user: req.user.id });

      if (!patient) {
        return res.status(404).json({
          message: "Profil patient introuvable",
        });
      }

      const analysis = await PatientAnalysis.findOne({
        _id: req.params.id,
        patient: patient._id,
      })
        .populate("analysisType", "name code category description normalRange")
        .populate("performedBy", "name")
        .populate("validatedBy", "name");

      if (!analysis) {
        return res.status(404).json({
          message: "Analyse introuvable",
        });
      }

      // Vérifier que les résultats sont disponibles
      if (
        analysis.status !== "completed" &&
        analysis.status !== "validated" &&
        analysis.status !== "delivered"
      ) {
        return res.status(403).json({
          message: "Les résultats ne sont pas encore disponibles",
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis results:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// ==========================================
// @route   GET /api/patient/dashboard/stats
// @desc    Get statistiques dashboard patient
// @access  Private (Patient)
// ==========================================
router.get(
  "/dashboard/stats",
  protect,
  authorize("patient"),
  async (req, res) => {
    try {
      const patient = await Patient.findOne({ user: req.user.id });

      if (!patient) {
        return res.status(404).json({
          message: "Profil patient introuvable",
        });
      }

      // Statistiques des analyses
      const totalAnalyses = await PatientAnalysis.countDocuments({
        patient: patient._id,
      });

      const pendingAnalyses = await PatientAnalysis.countDocuments({
        patient: patient._id,
        status: { $in: ["pending", "sample_collected", "in_progress"] },
      });

      const completedAnalyses = await PatientAnalysis.countDocuments({
        patient: patient._id,
        status: { $in: ["completed", "validated", "delivered"] },
      });

      // Statistiques des factures
      const totalFactures = await Facture.countDocuments({
        patient: patient._id,
      });

      const unpaidFactures = await Facture.countDocuments({
        patient: patient._id,
        statut: { $in: ["En attente", "En retard"] },
      });

      const paidFactures = await Facture.countDocuments({
        patient: patient._id,
        statut: "Payée",
      });

      // Montant total des factures impayées
      const unpaidAmount = await Facture.aggregate([
        {
          $match: {
            patient: patient._id,
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

      // Dernières analyses
      const recentAnalyses = await PatientAnalysis.find({
        patient: patient._id,
      })
        .populate("analysisType", "name code")
        .sort({ requestDate: -1 })
        .limit(5);

      res.json({
        analyses: {
          total: totalAnalyses,
          pending: pendingAnalyses,
          completed: completedAnalyses,
        },
        factures: {
          total: totalFactures,
          unpaid: unpaidFactures,
          paid: paidFactures,
          unpaidAmount: unpaidAmount[0]?.total || 0,
        },
        recentAnalyses,
      });
    } catch (error) {
      console.error("Error fetching patient dashboard stats:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  }
);

// ==========================================
// @route   GET /api/patient/profile
// @desc    Get mon profil patient
// @access  Private (Patient)
// ==========================================
router.get("/profile", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id }).populate(
      "prescribedBy",
      "name specialization"
    );

    if (!patient) {
      return res.status(404).json({
        message: "Profil patient introuvable",
      });
    }

    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ==========================================
// @route   PUT /api/patient/profile
// @desc    Update mon profil patient
// @access  Private (Patient)
// ==========================================
router.put("/profile", protect, authorize("patient"), async (req, res) => {
  try {
    const patient = await Patient.findOne({ user: req.user.id });

    if (!patient) {
      return res.status(404).json({
        message: "Profil patient introuvable",
      });
    }

    // Champs autorisés à la modification
    const allowedFields = ["phone", "address", "city", "emergencyContact"];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedPatient = await Patient.findByIdAndUpdate(
      patient._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      message: "Profil mis à jour avec succès",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
