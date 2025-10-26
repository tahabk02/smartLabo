// backend/src/models/Facture.js
// VERSION CORRIGÉE - patient optionnel

const mongoose = require("mongoose");

const factureSchema = new mongoose.Schema({
  // ========================================
  // IDENTIFICATION
  // ========================================
  numeroFacture: {
    type: String,
    required: true,
    unique: true,
  },

  // ========================================
  // RÉFÉRENCES
  // ========================================
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: false, // ✅ FIX: Optionnel car on utilise patientId
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true, // ✅ On utilise patientId comme champ principal
  },
  rendezvousId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RendezVous",
  },

  // ========================================
  // DATES
  // ========================================
  dateFacture: {
    type: Date,
    default: Date.now,
  },
  datePaiement: {
    type: Date,
  },

  // ========================================
  // MONTANTS
  // ========================================
  montantTotal: {
    type: Number,
    required: true,
  },
  montantPaye: {
    type: Number,
    default: 0,
  },

  // ========================================
  // MODES DE PAIEMENT
  // ========================================
  modePaiement: {
    type: String,
    enum: ["cash", "carte", "amana", "cashplus", "virement", "cheque"],
    default: "cash",
  },

  // ========================================
  // CODES DE PAIEMENT
  // ========================================
  codeAmana: {
    type: String,
    sparse: true,
  },
  codeCashPlus: {
    type: String,
    sparse: true,
  },

  // ========================================
  // INFORMATIONS VIREMENT
  // ========================================
  virementDetails: {
    banque: String,
    rib: String,
    swift: String,
    reference: String,
  },

  // ========================================
  // STATUT
  // ========================================
  statusPaiement: {
    type: String,
    enum: ["pending", "paid", "partially_paid", "cancelled", "refunded"],
    default: "pending",
  },
  statut: {
    type: String,
    enum: ["pending", "paid", "partially_paid", "cancelled", "refunded"],
    default: "pending",
  },

  // ========================================
  // ITEMS DE LA FACTURE
  // ========================================
  items: [
    {
      description: String,
      quantity: {
        type: Number,
        default: 1,
      },
      unitPrice: Number,
      total: Number,
    },
  ],

  // ========================================
  // ANALYSES ASSOCIÉES
  // ========================================
  analyseIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
    },
  ],

  // ========================================
  // NOTES ET MÉTADONNÉES
  // ========================================
  notes: {
    type: String,
  },

  // ========================================
  // PDF
  // ========================================
  pdfUrl: {
    type: String,
  },
  pdfGenerated: {
    type: Boolean,
    default: false,
  },

  // ========================================
  // TIMESTAMPS
  // ========================================
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ========================================
// MIDDLEWARE PRE-SAVE
// ========================================
factureSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // ✅ Synchroniser patient avec patientId si nécessaire
  if (this.patientId && !this.patient) {
    this.patient = this.patientId;
  }
  if (this.patient && !this.patientId) {
    this.patientId = this.patient;
  }

  // Synchroniser statut avec statusPaiement
  if (this.statusPaiement && !this.statut) {
    this.statut = this.statusPaiement;
  } else if (this.statut && !this.statusPaiement) {
    this.statusPaiement = this.statut;
  }

  next();
});

// ========================================
// INDEX POUR PERFORMANCE
// ========================================
factureSchema.index({ numeroFacture: 1 });
factureSchema.index({ patientId: 1 });
factureSchema.index({ patient: 1 });
factureSchema.index({ statusPaiement: 1 });
factureSchema.index({ statut: 1 });
factureSchema.index({ dateFacture: -1 });

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

factureSchema.methods.isPaid = function () {
  return (
    this.statusPaiement === "paid" ||
    this.statut === "paid" ||
    this.montantPaye >= this.montantTotal
  );
};

factureSchema.methods.getRemainingAmount = function () {
  return Math.max(0, this.montantTotal - (this.montantPaye || 0));
};

factureSchema.methods.getStatusLabel = function () {
  const labels = {
    pending: "En attente",
    paid: "Payée",
    partially_paid: "Partiellement payée",
    cancelled: "Annulée",
    refunded: "Remboursée",
  };
  return labels[this.statusPaiement] || labels[this.statut] || "Inconnu";
};

// ========================================
// MÉTHODES STATIQUES
// ========================================

factureSchema.statics.generateInvoiceNumber = async function () {
  const count = await this.countDocuments();
  return `FAC${String(count + 1).padStart(6, "0")}`;
};

factureSchema.statics.findByPatient = function (patientId) {
  return this.find({
    $or: [{ patient: patientId }, { patientId: patientId }],
  })
    .populate("analyseIds", "name category price")
    .sort({ dateFacture: -1 });
};

factureSchema.statics.findUnpaid = function () {
  return this.find({
    $or: [
      { statusPaiement: "pending" },
      { statusPaiement: "partially_paid" },
      { statut: "pending" },
      { statut: "partially_paid" },
    ],
  }).sort({ dateFacture: -1 });
};

// ========================================
// VIRTUALS
// ========================================

factureSchema.virtual("paymentPercentage").get(function () {
  if (this.montantTotal === 0) return 0;
  return Math.round((this.montantPaye / this.montantTotal) * 100);
});

factureSchema.virtual("isOverdue").get(function () {
  if (this.isPaid()) return false;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.dateFacture < thirtyDaysAgo;
});

factureSchema.set("toJSON", { virtuals: true });
factureSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Facture", factureSchema);
