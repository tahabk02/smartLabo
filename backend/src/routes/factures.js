const express = require("express");
const router = express.Router();
const Facture = require("../models/Facture");
const { protect, authorize } = require("../middleware/authMiddleware");

// @route   GET /api/factures
// @desc    Get all factures
// @access  Private (Admin, Receptionist)
router.get(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const factures = await Facture.find()
        .populate("patient", "nom prenom numeroPatient")
        .sort({ createdAt: -1 });
      res.json(factures);
    } catch (error) {
      console.error("Error fetching factures:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/factures/:id
// @desc    Get facture by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id).populate(
      "patient",
      "nom prenom numeroPatient telephone email"
    );

    if (!facture) {
      return res.status(404).json({ message: "Facture not found" });
    }
    res.json(facture);
  } catch (error) {
    console.error("Error fetching facture:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/factures
// @desc    Create new facture
// @access  Private (Admin, Receptionist)
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      console.log("📝 Creating facture with data:", req.body);

      // Valider que patient est présent
      if (!req.body.patient && !req.body.patientId) {
        return res.status(400).json({
          message: "Le patient est requis (patient ou patientId)",
        });
      }

      // Préparer les données de la facture
      const factureData = {
        ...req.body,
        // Assurer que patient est défini (supporte patient ou patientId)
        patient: req.body.patient || req.body.patientId,
        createdBy: req.user.id,
      };

      // Le numeroFacture sera auto-généré par le middleware du modèle
      // On peut le supprimer s'il existe déjà dans req.body pour éviter les conflits
      delete factureData.numeroFacture;
      delete factureData.invoiceNumber;

      console.log("📋 Prepared facture data:", factureData);

      const facture = new Facture(factureData);
      await facture.save();

      const populatedFacture = await Facture.findById(facture._id).populate(
        "patient",
        "nom prenom numeroPatient"
      );

      console.log("✅ Facture created:", populatedFacture);
      res.status(201).json(populatedFacture);
    } catch (error) {
      console.error("❌ Error creating facture:", error);
      res.status(400).json({
        message: "Erreur lors de la création de la facture",
        error: error.message,
        details: error.errors
          ? Object.keys(error.errors).map((key) => ({
              field: key,
              message: error.errors[key].message,
            }))
          : null,
      });
    }
  }
);

// @route   PUT /api/factures/:id
// @desc    Update facture
// @access  Private (Admin, Receptionist)
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      // Préparer les données de mise à jour
      const updateData = { ...req.body };

      // Assurer la compatibilité patient/patientId
      if (updateData.patientId && !updateData.patient) {
        updateData.patient = updateData.patientId;
      }

      const facture = await Facture.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("patient", "nom prenom numeroPatient");

      if (!facture) {
        return res.status(404).json({ message: "Facture not found" });
      }

      res.json(facture);
    } catch (error) {
      console.error("Error updating facture:", error);
      res.status(400).json({
        message: "Erreur lors de la mise à jour",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/factures/:id
// @desc    Delete facture
// @access  Private (Admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const facture = await Facture.findByIdAndDelete(req.params.id);

    if (!facture) {
      return res.status(404).json({ message: "Facture not found" });
    }

    res.json({ message: "Facture deleted successfully" });
  } catch (error) {
    console.error("Error deleting facture:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/factures/:id/status
// @desc    Update facture status
// @access  Private (Admin, Receptionist)
router.put(
  "/:id/status",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const { statut } = req.body;

      const facture = await Facture.findByIdAndUpdate(
        req.params.id,
        { statut },
        { new: true }
      ).populate("patient", "nom prenom numeroPatient");

      if (!facture) {
        return res.status(404).json({ message: "Facture not found" });
      }

      res.json(facture);
    } catch (error) {
      console.error("Error updating facture status:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/factures/stats/overview
// @desc    Get factures statistics
// @access  Private (Admin, Receptionist)
router.get(
  "/stats/overview",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const total = await Facture.countDocuments();
      const payees = await Facture.countDocuments({ statut: "Payée" });
      const enAttente = await Facture.countDocuments({ statut: "En attente" });
      const enRetard = await Facture.countDocuments({ statut: "En retard" });

      const totalMontant = await Facture.aggregate([
        { $group: { _id: null, total: { $sum: "$montantTotal" } } },
      ]);

      const montantPaye = await Facture.aggregate([
        { $match: { statut: "Payée" } },
        { $group: { _id: null, total: { $sum: "$montantTotal" } } },
      ]);

      res.json({
        total,
        payees,
        enAttente,
        enRetard,
        totalMontant: totalMontant[0]?.total || 0,
        montantPaye: montantPaye[0]?.total || 0,
      });
    } catch (error) {
      console.error("Error fetching factures stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
