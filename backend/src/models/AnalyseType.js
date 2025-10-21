const mongoose = require("mongoose");

const analyseTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Le prix est obligatoire"],
      min: [0, "Le prix doit être positif"],
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "Hématologie",
        "Biochimie",
        "Immunologie",
        "Microbiologie",
        "Autre",
      ],
      default: "Autre",
    },
    normalRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    turnaroundTime: {
      type: Number, // en heures
      default: 24,
    },
  },
  { timestamps: true }
);

// Index texte pour recherche
analyseTypeSchema.index({ name: "text", description: "text" });

// Middleware pour nettoyer le nom avant sauvegarde
analyseTypeSchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim();
  next();
});

// Méthode pour afficher le prix formaté
analyseTypeSchema.methods.getFormattedPrice = function () {
  return `${this.price.toFixed(2)} DH`;
};

const AnalyseType = mongoose.model(
  "AnalyseType",
  analyseTypeSchema,
  "analyseTypes"
);

module.exports = AnalyseType;
