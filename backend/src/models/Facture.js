const mongoose = require("mongoose");

// ==========================================
// 💰 MODÈLE FACTURE / INVOICE
// ==========================================
const factureSchema = new mongoose.Schema(
  {
    // Numéro de facture (auto-généré)
    invoiceNumber: {
      type: String,
      unique: true,
    },

    // Alias pour compatibilité
    numeroFacture: {
      type: String,
      unique: true,
      sparse: true, // Permet les valeurs null sans conflit d'unicité
    },

    // Patient (supporte les deux noms de champs)
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Le patient est requis"],
    },

    // Date de la facture
    dateFacture: {
      type: Date,
      default: Date.now,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    // Date d'échéance
    dateDue: {
      type: Date,
    },

    // Montant total
    montantTotal: {
      type: Number,
      required: [true, "Le montant est requis"],
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    // Items/Services facturés
    items: [
      {
        description: String,
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: Number,
        total: Number,
        analysis: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Analysis",
        },
      },
    ],

    // Statut de paiement
    statut: {
      type: String,
      enum: ["En attente", "Payée", "En retard", "Annulée"],
      default: "En attente",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "overdue", "cancelled"],
      default: "pending",
    },

    // Méthode de paiement
    paymentMethod: {
      type: String,
      enum: ["Espèces", "Carte", "Chèque", "Virement", "Autre"],
    },

    // Notes
    notes: String,

    // Créé par
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// 🔹 MIDDLEWARE: Auto-générer le numéro de facture
// ==========================================
factureSchema.pre("save", async function (next) {
  // Générer invoiceNumber si non défini
  if (this.isNew && !this.invoiceNumber && !this.numeroFacture) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Compter les factures de ce mois
    const count = await mongoose.model("Invoice").countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1),
      },
    });

    const invoiceNum = `INV${year}${month}${String(count + 1).padStart(
      4,
      "0"
    )}`;
    this.invoiceNumber = invoiceNum;
    this.numeroFacture = invoiceNum;
  }

  // Synchroniser les champs alias
  if (this.invoiceNumber && !this.numeroFacture) {
    this.numeroFacture = this.invoiceNumber;
  }
  if (this.numeroFacture && !this.invoiceNumber) {
    this.invoiceNumber = this.numeroFacture;
  }

  // Synchroniser les montants
  if (this.montantTotal && !this.totalAmount) {
    this.totalAmount = this.montantTotal;
  }
  if (this.totalAmount && !this.montantTotal) {
    this.montantTotal = this.totalAmount;
  }

  // Synchroniser les statuts
  const statusMap = {
    "En attente": "pending",
    Payée: "paid",
    "En retard": "overdue",
    Annulée: "cancelled",
  };
  const reverseMap = {
    pending: "En attente",
    paid: "Payée",
    overdue: "En retard",
    cancelled: "Annulée",
  };

  if (this.statut && !this.status) {
    this.status = statusMap[this.statut] || "pending";
  }
  if (this.status && !this.statut) {
    this.statut = reverseMap[this.status] || "En attente";
  }

  next();
});

// ==========================================
// 🔹 MIDDLEWARE: Calculer le montant total
// ==========================================
factureSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.montantTotal = this.items.reduce((sum, item) => {
      return sum + (item.total || item.quantity * item.unitPrice || 0);
    }, 0);
    this.totalAmount = this.montantTotal;
  }
  next();
});

// ==========================================
// 🔹 INDEX
// ==========================================
factureSchema.index({ patient: 1 });
factureSchema.index({ invoiceNumber: 1 });
factureSchema.index({ numeroFacture: 1 });
factureSchema.index({ statut: 1 });
factureSchema.index({ status: 1 });
factureSchema.index({ dateFacture: -1 });

// ==========================================
// 🔹 EXPORT MODEL
// ==========================================
module.exports =
  mongoose.models.Invoice ||
  mongoose.models.Facture ||
  mongoose.model("Invoice", factureSchema);
