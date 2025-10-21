const mongoose = require("mongoose");

// ==========================================
// 🧪 CATALOGUE DES ANALYSES
// ==========================================
const analysisSchema = new mongoose.Schema(
  {
    // Code unique de l'analyse
    code: {
      type: String,
      required: [true, "Le code est requis"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Nom de l'analyse
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },

    // Catégorie
    category: {
      type: String,
      required: [true, "La catégorie est requise"],
      enum: [
        "Hématologie",
        "Biochimie",
        "Immunologie",
        "Microbiologie",
        "Parasitologie",
        "Hormonologie",
        "Sérologie",
        "Toxicologie",
        "Autre",
      ],
    },

    // Description
    description: {
      type: String,
      trim: true,
    },

    // Prix
    price: {
      type: Number,
      required: [true, "Le prix est requis"],
      min: [0, "Le prix doit être positif"],
    },

    // Plage normale de résultats
    normalRange: {
      type: String,
      trim: true,
    },

    // Délai de traitement
    turnaroundTime: {
      type: String,
      default: "24 hours",
    },

    // Type d'échantillon requis
    sampleType: {
      type: String,
      enum: ["Sang", "Urine", "Selles", "Salive", "Autre"],
      default: "Sang",
    },

    // Instructions de prélèvement
    instructions: {
      type: String,
      trim: true,
    },

    // Statut actif/inactif
    isActive: {
      type: Boolean,
      default: true,
    },

    // Métadonnées
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
// 🔹 INDEX
// ==========================================
analysisSchema.index({ code: 1 });
analysisSchema.index({ name: 1 });
analysisSchema.index({ category: 1 });
analysisSchema.index({ isActive: 1 });

// ==========================================
// 🔹 EXPORT MODEL (avec protection contre l'écrasement)
// ==========================================
module.exports =
  mongoose.models.Analysis || mongoose.model("Analysis", analysisSchema);
