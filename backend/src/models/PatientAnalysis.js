const mongoose = require("mongoose");

// ==========================================
// 🧪 RÉSULTATS D'ANALYSE PATIENT
// ==========================================
const patientAnalysisSchema = new mongoose.Schema(
  {
    // Numéro unique d'analyse
    analysisNumber: {
      type: String,
      unique: true,
      required: true,
    },

    // Patient concerné
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // Type d'analyse (référence au catalogue)
    analysisType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },

    // Médecin prescripteur
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ==========================================
    // 📅 DATES
    // ==========================================
    requestDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    sampleDate: Date, // Date de prélèvement

    resultDate: Date, // Date des résultats

    // ==========================================
    // 🧪 ÉCHANTILLON
    // ==========================================
    sample: {
      type: {
        type: String,
        enum: ["Sang", "Urine", "Selles", "Salive", "Autre"],
      },
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      collectionTime: Date,
      notes: String,
    },

    // ==========================================
    // 📊 RÉSULTATS
    // ==========================================
    results: [
      {
        parameter: {
          type: String,
          required: true, // Ex: "Hémoglobine", "Glucose", "Cholestérol"
        },
        value: {
          type: mongoose.Schema.Types.Mixed, // Peut être String ou Number
          required: true,
        },
        unit: String, // Ex: "g/dL", "mg/dL", "mmol/L"
        referenceRange: {
          min: Number,
          max: Number,
          text: String, // Ex: "12-16 g/dL" ou "Négatif"
        },
        isAbnormal: {
          type: Boolean,
          default: false,
        },
        severity: {
          type: String,
          enum: ["normal", "low", "high", "critical"],
          default: "normal",
        },
        notes: String,
      },
    ],

    // ==========================================
    // 🔍 INTERPRÉTATION & CONCLUSION
    // ==========================================
    interpretation: String, // Interprétation du biologiste
    conclusion: String,
    recommendations: String,

    // ==========================================
    // 📄 DOCUMENTS
    // ==========================================
    reportPdf: {
      url: String,
      publicId: String,
      filename: String,
    },

    attachments: [
      {
        name: String,
        url: String,
        publicId: String,
        type: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==========================================
    // 📊 STATUT
    // ==========================================
    status: {
      type: String,
      enum: [
        "pending", // En attente
        "sample_collected", // Échantillon prélevé
        "in_progress", // En cours d'analyse
        "completed", // Terminé
        "validated", // Validé par biologiste
        "delivered", // Remis au patient
        "cancelled", // Annulé
      ],
      default: "pending",
    },

    // ==========================================
    // 👨‍🔬 VALIDATION
    // ==========================================
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Technicien de labo
    },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Biologiste
    },
    validatedAt: Date,

    // ==========================================
    // 🔔 NOTIFICATIONS
    // ==========================================
    notifiedPatient: {
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
    // 💰 FACTURATION
    // ==========================================
    price: {
      type: Number,
      required: true,
      default: 0,
    },

    paid: {
      type: Boolean,
      default: false,
    },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },

    // ==========================================
    // 📝 NOTES INTERNES
    // ==========================================
    internalNotes: String,

    // Urgence
    isUrgent: {
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
// 🔹 MIDDLEWARE: Générer numéro d'analyse
// ==========================================
patientAnalysisSchema.pre("save", async function (next) {
  if (this.isNew && !this.analysisNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose
      .model("PatientAnalysis")
      .countDocuments({ analysisNumber: new RegExp(`^ANA${year}`) });
    this.analysisNumber = `ANA${year}${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// ==========================================
// 🔹 MIDDLEWARE: Détecter valeurs anormales
// ==========================================
patientAnalysisSchema.pre("save", function (next) {
  if (this.results && this.results.length > 0) {
    this.results.forEach((result) => {
      if (
        result.referenceRange &&
        result.referenceRange.min !== undefined &&
        result.referenceRange.max !== undefined
      ) {
        const value = parseFloat(result.value);
        if (!isNaN(value)) {
          if (value < result.referenceRange.min) {
            result.isAbnormal = true;
            result.severity =
              value < result.referenceRange.min * 0.5 ? "critical" : "low";
          } else if (value > result.referenceRange.max) {
            result.isAbnormal = true;
            result.severity =
              value > result.referenceRange.max * 1.5 ? "critical" : "high";
          } else {
            result.isAbnormal = false;
            result.severity = "normal";
          }
        }
      }
    });
  }
  next();
});

// ==========================================
// 🔹 VIRTUAL: Compte des anomalies
// ==========================================
patientAnalysisSchema.virtual("abnormalCount").get(function () {
  return this.results ? this.results.filter((r) => r.isAbnormal).length : 0;
});

// ==========================================
// 🔹 VIRTUAL: A des résultats critiques
// ==========================================
patientAnalysisSchema.virtual("hasCriticalResults").get(function () {
  return this.results
    ? this.results.some((r) => r.severity === "critical")
    : false;
});

// ==========================================
// 🔹 INDEX
// ==========================================
patientAnalysisSchema.index({ patient: 1 });
patientAnalysisSchema.index({ analysisNumber: 1 });
patientAnalysisSchema.index({ status: 1 });
patientAnalysisSchema.index({ requestDate: -1 });
patientAnalysisSchema.index({ analysisType: 1 });

patientAnalysisSchema.set("toJSON", { virtuals: true });
patientAnalysisSchema.set("toObject", { virtuals: true });

// ==========================================
// 🔹 EXPORT MODEL (avec protection contre l'écrasement)
// ==========================================
module.exports =
  mongoose.models.PatientAnalysis ||
  mongoose.model("PatientAnalysis", patientAnalysisSchema);
