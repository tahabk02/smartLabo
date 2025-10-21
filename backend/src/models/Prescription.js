const mongoose = require("mongoose");

// ==========================================
// 💊 ORDONNANCE (PRESCRIPTION)
// ==========================================
const prescriptionSchema = new mongoose.Schema(
  {
    // Numéro unique d'ordonnance
    prescriptionNumber: {
      type: String,
      unique: true,
      required: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Date de prescription
    prescriptionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // ==========================================
    // 💊 MÉDICAMENTS PRESCRITS
    // ==========================================
    medications: [
      {
        name: {
          type: String,
          required: true,
        },
        dosage: {
          type: String,
          required: true, // Ex: "500mg", "10ml"
        },
        frequency: {
          type: String,
          required: true, // Ex: "3 fois par jour", "Toutes les 8h"
        },
        duration: {
          type: String,
          required: true, // Ex: "7 jours", "2 semaines"
        },
        instructions: String, // Ex: "Après les repas", "Le matin à jeun"
        quantity: Number, // Quantité à délivrer
      },
    ],

    // ==========================================
    // 📝 INSTRUCTIONS GÉNÉRALES
    // ==========================================
    generalInstructions: String,

    // Diagnostic (optionnel mais recommandé)
    diagnosis: String,

    // ==========================================
    // 📄 PDF & QR CODE
    // ==========================================
    pdfUrl: String, // URL du PDF généré
    qrCode: {
      url: String,
      data: String, // Données encodées (ID + hash pour validation)
    },

    // ==========================================
    // 📊 STATUT
    // ==========================================
    status: {
      type: String,
      enum: ["active", "delivered", "expired", "cancelled"],
      default: "active",
    },

    // Date d'expiration (généralement 3 mois après émission)
    expiryDate: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // +90 jours
      },
    },

    // ==========================================
    // 📧 ENVOI AU PATIENT
    // ==========================================
    sentToPatient: {
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
      },
    },

    // ==========================================
    // 🔐 VALIDATION & SÉCURITÉ
    // ==========================================
    validationHash: String, // Hash pour vérifier l'authenticité
    isValidated: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // 🔒 AUDIT
    // ==========================================
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// 🔹 MIDDLEWARE: Générer numéro d'ordonnance
// ==========================================
prescriptionSchema.pre("save", async function (next) {
  if (this.isNew && !this.prescriptionNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose
      .model("Prescription")
      .countDocuments({ prescriptionNumber: new RegExp(`^ORD${year}`) });
    this.prescriptionNumber = `ORD${year}${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// ==========================================
// 🔹 VIRTUAL: Vérifier si expiré
// ==========================================
prescriptionSchema.virtual("isExpired").get(function () {
  return this.expiryDate < new Date();
});

// ==========================================
// 🔹 INDEX
// ==========================================
prescriptionSchema.index({ patient: 1 });
prescriptionSchema.index({ doctor: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });

prescriptionSchema.set("toJSON", { virtuals: true });
prescriptionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Prescription", prescriptionSchema);
