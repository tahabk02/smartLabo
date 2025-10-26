// backend/routes/factures.js - VERSION CORRIGÉE COMPLÈTE

const express = require("express");
const router = express.Router();
const path = require("path");
const Facture = require("../models/Facture");
const Patient = require("../models/Patient");
const Analysis = require("../models/Analysis");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  generateAmanaCode,
  generateCashPlusCode,
  generateVirementReference,
} = require("../utils/paymentCodes");
const { generateInvoicePDF } = require("../utils/pdfGenerator");

// ========================================
// ✅ HELPER FUNCTIONS - RECHERCHE PAR EMAIL
// ========================================

/**
 * Trouver le Patient ID à partir du User (par email)
 */
async function getPatientIdFromUser(user) {
  const patient = await Patient.findOne({ email: user.email });
  return patient ? patient._id : null;
}

/**
 * Vérifier si l'utilisateur peut accéder à une facture
 */
async function canAccessInvoice(user, invoiceId) {
  if (user.role === "admin" || user.role === "receptionist") return true;

  const facture = await Facture.findById(invoiceId);
  if (!facture) return false;

  const patientId = await getPatientIdFromUser(user);
  if (!patientId) return false;

  const facturePatientId = facture.patientId || facture.patient;
  const match = facturePatientId.toString() === patientId.toString();

  console.log(
    `   🔍 Auth: ${
      user.email
    } → Patient ${patientId} vs Facture ${facturePatientId} = ${
      match ? "✅" : "❌"
    }`
  );

  return match;
}

// ========================================
// ROUTES SPÉCIFIQUES (AVANT /:id)
// ========================================

/**
 * @route   POST /api/invoices/:id/generate-payment-code
 * @desc    Générer un code de paiement
 * @access  Private (Patient ou Admin)
 */
router.post("/:id/generate-payment-code", protect, async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    console.log(`💳 [CODE] Invoice ${req.params.id}, User ${req.user.email}`);

    // ✅ Vérification d'accès corrigée
    const hasAccess = await canAccessInvoice(req.user, req.params.id);
    if (!hasAccess) {
      console.log(`❌ [CODE] Access DENIED for ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette facture",
      });
    }

    console.log(`✅ [CODE] Access GRANTED for ${req.user.email}`);

    const facture = await Facture.findById(req.params.id);

    switch (paymentMethod) {
      case "amana":
        facture.codeAmana = generateAmanaCode();
        facture.modePaiement = "amana";
        console.log(`   Code Amana: ${facture.codeAmana}`);
        break;

      case "cashplus":
        facture.codeCashPlus = generateCashPlusCode();
        facture.modePaiement = "cashplus";
        console.log(`   Code CashPlus: ${facture.codeCashPlus}`);
        break;

      case "virement":
        const reference = generateVirementReference(facture.numeroFacture);
        facture.virementDetails = {
          banque: "Banque Populaire",
          rib: "230 810 0001234567890123 45",
          swift: "BCPOMAMC",
          reference: reference,
        };
        facture.modePaiement = "virement";
        console.log(`   Référence: ${reference}`);
        break;

      case "carte":
        facture.modePaiement = "carte";
        break;

      case "cash":
        facture.modePaiement = "cash";
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Méthode de paiement invalide",
        });
    }

    await facture.save();

    console.log(`✅ [CODE] Generated for ${facture.numeroFacture}`);

    res.json({
      success: true,
      message: "Code de paiement généré avec succès",
      data: {
        paymentMethod: facture.modePaiement,
        codeAmana: facture.codeAmana,
        codeCashPlus: facture.codeCashPlus,
        virementDetails: facture.virementDetails,
        invoiceNumber: facture.numeroFacture,
        totalAmount: facture.montantTotal,
        invoiceId: facture._id,
      },
    });
  } catch (error) {
    console.error("❌ [CODE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du code de paiement",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Générer et télécharger le PDF
 * @access  Private
 */
router.get("/:id/pdf", protect, async (req, res) => {
  try {
    console.log(`📄 [PDF] Invoice ${req.params.id}, User ${req.user.email}`);

    // ✅ Vérification d'accès corrigée
    const hasAccess = await canAccessInvoice(req.user, req.params.id);
    if (!hasAccess) {
      console.log(`❌ [PDF] Access DENIED for ${req.user.email}`);
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé à cette facture",
      });
    }

    console.log(`✅ [PDF] Access GRANTED for ${req.user.email}`);

    const facture = await Facture.findById(req.params.id)
      .populate("patient", "nom prenom email telephone numeroPatient")
      .populate("patientId", "nom prenom email telephone numeroPatient")
      .populate("analyseIds", "name category price code");

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée",
      });
    }

    const patientData = facture.patientId || facture.patient;

    if (!patientData) {
      return res.status(404).json({
        success: false,
        message: "Données patient introuvables",
      });
    }

    console.log(`📄 [PDF] Generating for ${facture.numeroFacture}`);

    const filename = await generateInvoicePDF(
      facture,
      patientData,
      facture.analyseIds || []
    );

    // ✅ FIX: Mise à jour sans validation stricte
    await Facture.updateOne(
      { _id: facture._id },
      {
        $set: {
          pdfGenerated: true,
          pdfUrl: `/uploads/invoices/${filename}`,
        },
      }
    );

    console.log(`✅ [PDF] Generated: ${filename}`);

    const filepath = path.join(__dirname, `../../uploads/invoices/${filename}`);
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error(`❌ [PDF] Error sending file:`, err);
      }
    });
  } catch (error) {
    console.error("❌ [PDF] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du PDF",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/invoices/:id/download
 * @desc    Télécharger la facture en PDF
 * @access  Private
 */
router.get("/:id/download", protect, async (req, res) => {
  try {
    console.log(`📥 [DOWNLOAD] Invoice ${req.params.id}`);

    const hasAccess = await canAccessInvoice(req.user, req.params.id);
    if (!hasAccess) {
      console.log(`❌ [DOWNLOAD] Access DENIED`);
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    console.log(`✅ [DOWNLOAD] Access granted, redirecting to PDF`);
    return res.redirect(`/api/invoices/${req.params.id}/pdf`);
  } catch (error) {
    console.error("❌ [DOWNLOAD] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du téléchargement",
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/invoices/:id/mark-paid
 * @desc    Marquer une facture comme payée
 * @access  Private (Admin, Receptionist)
 */
router.patch(
  "/:id/mark-paid",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const { montantPaye, datePaiement, paymentMethod } = req.body;

      console.log(`💰 [MARK PAID] Invoice ${req.params.id}`);

      const facture = await Facture.findById(req.params.id);

      if (!facture) {
        return res.status(404).json({
          success: false,
          message: "Facture non trouvée",
        });
      }

      facture.montantPaye = montantPaye || facture.montantTotal;
      facture.datePaiement = datePaiement || new Date();

      if (paymentMethod) {
        facture.modePaiement = paymentMethod;
      }

      if (facture.montantPaye >= facture.montantTotal) {
        facture.statusPaiement = "paid";
        facture.statut = "paid";
      } else if (facture.montantPaye > 0) {
        facture.statusPaiement = "partially_paid";
        facture.statut = "partially_paid";
      }

      await facture.save();

      console.log(
        `✅ [MARK PAID] ${facture.numeroFacture} → ${facture.statusPaiement}`
      );

      res.json({
        success: true,
        message: "Paiement enregistré avec succès",
        data: facture,
      });
    } catch (error) {
      console.error("❌ [MARK PAID] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de l'enregistrement du paiement",
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/invoices/:id/pay
 * @desc    Marquer comme payée
 * @access  Private (Admin, Receptionist)
 */
router.put(
  "/:id/pay",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const { paymentMethod, paidAmount } = req.body;

      console.log(`💳 [PAY] Invoice ${req.params.id}`);

      const facture = await Facture.findById(req.params.id);

      if (!facture) {
        return res.status(404).json({
          success: false,
          message: "Facture non trouvée",
        });
      }

      facture.statut = "paid";
      facture.statusPaiement = "paid";
      facture.datePaiement = new Date();
      facture.paidDate = new Date();
      facture.modePaiement = paymentMethod;
      facture.paymentMethod = paymentMethod;
      if (paidAmount) {
        facture.montantPaye = paidAmount;
      }

      await facture.save();

      console.log(`✅ [PAY] ${facture.numeroFacture} marked as paid`);
      res.json({
        success: true,
        message: "Facture marquée comme payée",
        data: facture,
      });
    } catch (error) {
      console.error("❌ [PAY] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors du paiement",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/invoices/stats/overview
 * @desc    Statistiques des factures
 * @access  Private (Admin, Receptionist)
 */
router.get(
  "/stats/overview",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const factures = await Facture.find().lean();

      const stats = {
        total: factures.length,
        paid: factures.filter((f) => (f.statut || f.statusPaiement) === "paid")
          .length,
        pending: factures.filter(
          (f) => (f.statut || f.statusPaiement) === "pending"
        ).length,
        overdue: factures.filter(
          (f) => (f.statut || f.statusPaiement) === "overdue"
        ).length,
        totalAmount: factures.reduce(
          (sum, f) => sum + (f.montantTotal || f.totalAmount || 0),
          0
        ),
        paidAmount: factures
          .filter((f) => (f.statut || f.statusPaiement) === "paid")
          .reduce((sum, f) => sum + (f.montantTotal || f.totalAmount || 0), 0),
        pendingAmount: factures
          .filter((f) => (f.statut || f.statusPaiement) === "pending")
          .reduce((sum, f) => sum + (f.montantTotal || f.totalAmount || 0), 0),
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("❌ [STATS] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  }
);

// ========================================
// ROUTES PATIENT
// ========================================

/**
 * @route   GET /api/patient/invoices
 * @desc    Factures du patient connecté
 * @access  Private (Patient only)
 */
router.get("/invoices", protect, async (req, res) => {
  try {
    console.log(`📋 [PATIENT INVOICES] User: ${req.user.email}`);

    // ✅ Recherche par email
    const patientId = await getPatientIdFromUser(req.user);

    if (!patientId) {
      console.log("⚠️  No patient found");
      return res.json([]);
    }

    console.log(`✅ Patient found: ${patientId}`);

    const factures = await Facture.find({ patientId })
      .populate("rendezvousId", "dateRdv statut")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Found ${factures.length} invoice(s)`);

    const mappedInvoices = factures.map((facture) => ({
      _id: facture._id,
      invoiceNumber: facture.numeroFacture || facture.invoiceNumber,
      issueDate:
        facture.dateFacture || facture.dateEmission || facture.createdAt,
      dueDate: facture.dateEcheance || facture.dueDate,
      status: facture.statut || facture.statusPaiement || "pending",
      totalAmount: facture.montantTotal || facture.totalAmount || 0,
      subtotal: facture.montantHT || facture.subtotal,
      taxAmount: facture.montantTVA || facture.taxAmount,
      items: facture.items || facture.lignes || [],
      appointmentId: facture.rendezvousId || facture.appointmentId,
      paidDate: facture.datePaiement || facture.paidDate,
      paymentMethod: facture.modePaiement || facture.paymentMethod,
      patientId: facture.patientId,
      codeAmana: facture.codeAmana,
      codeCashPlus: facture.codeCashPlus,
      virementDetails: facture.virementDetails,
    }));

    res.json(mappedInvoices);
  } catch (error) {
    console.error("❌ [PATIENT INVOICES] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des factures",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/patient/invoices/:id
 * @desc    Détail d'une facture patient
 * @access  Private (Patient only)
 */
router.get("/invoices/:id", protect, async (req, res) => {
  try {
    console.log(`📋 [PATIENT INVOICE] ${req.params.id} by ${req.user.email}`);

    const patientId = await getPatientIdFromUser(req.user);

    const facture = await Facture.findOne({
      _id: req.params.id,
      patientId: patientId,
    }).populate("rendezvousId");

    if (!facture) {
      console.log("❌ Invoice not found or unauthorized");
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée",
      });
    }

    const mappedInvoice = {
      _id: facture._id,
      invoiceNumber: facture.numeroFacture || facture.invoiceNumber,
      issueDate:
        facture.dateFacture || facture.dateEmission || facture.createdAt,
      dueDate: facture.dateEcheance || facture.dueDate,
      status: facture.statut || facture.statusPaiement || "pending",
      totalAmount: facture.montantTotal || facture.totalAmount || 0,
      subtotal: facture.montantHT || facture.subtotal,
      taxAmount: facture.montantTVA || facture.taxAmount,
      items: facture.items || facture.lignes || [],
      appointmentId: facture.rendezvousId || facture.appointmentId,
      paidDate: facture.datePaiement || facture.paidDate,
      paymentMethod: facture.modePaiement || facture.paymentMethod,
      patientId: facture.patientId,
      codeAmana: facture.codeAmana,
      codeCashPlus: facture.codeCashPlus,
      virementDetails: facture.virementDetails,
    };

    console.log("✅ Invoice found");
    res.json(mappedInvoice);
  } catch (error) {
    console.error("❌ [PATIENT INVOICE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la facture",
      error: error.message,
    });
  }
});

// ========================================
// ROUTES ADMIN/STAFF - CRUD
// ========================================

/**
 * @route   GET /api/invoices
 * @desc    Toutes les factures (Admin/Staff)
 * @access  Private (Admin, Receptionist)
 */
router.get(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      console.log("📋 [ADMIN] Fetching all invoices");

      const factures = await Facture.find()
        .populate("patientId", "nom prenom numeroPatient email")
        .populate("patient", "nom prenom numeroPatient email")
        .populate("rendezvousId", "dateRdv statut")
        .sort({ createdAt: -1 })
        .lean();

      console.log(`✅ Found ${factures.length} invoice(s)`);
      res.json(factures);
    } catch (error) {
      console.error("❌ [ADMIN] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération des factures",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Facture par ID (Admin/Staff)
 * @access  Private (Admin, Receptionist)
 */
router.get(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      console.log(`📋 [ADMIN] Fetching invoice ${req.params.id}`);

      const facture = await Facture.findById(req.params.id)
        .populate("patientId")
        .populate("patient")
        .populate("rendezvousId");

      if (!facture) {
        return res.status(404).json({
          success: false,
          message: "Facture non trouvée",
        });
      }

      console.log("✅ Invoice found");
      res.json(facture);
    } catch (error) {
      console.error("❌ [ADMIN] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la récupération de la facture",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/invoices
 * @desc    Créer une facture
 * @access  Private (Admin, Receptionist)
 */
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      console.log("📝 [CREATE] New invoice");

      const count = await Facture.countDocuments();
      const numeroFacture = `FAC${String(count + 1).padStart(6, "0")}`;

      const userId = req.user._id || req.user.id;
      const facture = new Facture({
        ...req.body,
        numeroFacture,
        createdBy: userId,
      });

      await facture.save();

      console.log(`✅ Invoice created: ${numeroFacture}`);
      res.status(201).json({
        success: true,
        message: "Facture créée avec succès",
        data: facture,
      });
    } catch (error) {
      console.error("❌ [CREATE] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la facture",
        error: error.message,
      });
    }
  }
);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Mettre à jour une facture
 * @access  Private (Admin, Receptionist)
 */
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      console.log(`📝 [UPDATE] Invoice ${req.params.id}`);

      const facture = await Facture.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!facture) {
        return res.status(404).json({
          success: false,
          message: "Facture non trouvée",
        });
      }

      console.log(`✅ Invoice updated: ${facture.numeroFacture}`);
      res.json({
        success: true,
        message: "Facture mise à jour avec succès",
        data: facture,
      });
    } catch (error) {
      console.error("❌ [UPDATE] Error:", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour de la facture",
        error: error.message,
      });
    }
  }
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Supprimer une facture
 * @access  Private (Admin only)
 */
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    console.log(`🗑️ [DELETE] Invoice ${req.params.id}`);

    const facture = await Facture.findByIdAndDelete(req.params.id);

    if (!facture) {
      return res.status(404).json({
        success: false,
        message: "Facture non trouvée",
      });
    }

    console.log(`✅ Invoice deleted: ${facture.numeroFacture}`);
    res.json({
      success: true,
      message: "Facture supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ [DELETE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la facture",
      error: error.message,
    });
  }
});

module.exports = router;
