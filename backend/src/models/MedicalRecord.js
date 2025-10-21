const mongoose = require("mongoose");

// ==========================================
// 📋 DOSSIER MÉDICAL CENTRAL
// ==========================================
const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      unique: true, // Un seul dossier par patient
    },

    // ==========================================
    // 🩺 CONSULTATIONS
    // ==========================================
    consultations: [
      {
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        doctor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        motif: {
          type: String,
          required: true,
        },
        symptoms: [String], // Symptômes
        diagnosis: String, // Diagnostic
        treatment: String, // Traitement recommandé
        notes: String, // Notes du médecin

        // Constantes vitales
        vitals: {
          temperature: Number, // °C
          bloodPressure: {
            systolic: Number,
            diastolic: Number,
          },
          heartRate: Number, // bpm
          weight: Number, // kg
          height: Number, // cm
          oxygenSaturation: Number, // %
        },

        // Documents liés
        attachments: [
          {
            name: String,
            url: String,
            type: String, // "pdf", "image", "document"
            uploadedAt: Date,
          },
        ],

        // Prescription (ordonnance)
        prescription: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Prescription",
        },

        // Statut
        status: {
          type: String,
          enum: ["en_cours", "terminée", "annulée"],
          default: "terminée",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==========================================
    // 🧪 ANALYSES & EXAMENS
    // ==========================================
    analyses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Analysis",
      },
    ],

    // ==========================================
    // 💰 FACTURES
    // ==========================================
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],

    // ==========================================
    // 📄 DOCUMENTS MÉDICAUX
    // ==========================================
    documents: [
      {
        title: String,
        category: {
          type: String,
          enum: [
            "Analyse",
            "Radio",
            "Scanner",
            "IRM",
            "Échographie",
            "Certificat",
            "Ordonnance",
            "Rapport",
            "Autre",
          ],
        },
        file: {
          url: String,
          publicId: String,
          filename: String,
          mimetype: String,
          size: Number,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],

    // ==========================================
    // 📝 NOTES MÉDICALES GÉNÉRALES
    // ==========================================
    generalNotes: [
      {
        content: String,
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isImportant: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // ==========================================
    // 🔒 AUDIT TRAIL
    // ==========================================
    lastAccessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastAccessedAt: Date,
  },
  {
    timestamps: true,
  }
);

// ==========================================
// 🔹 INDEX
// ==========================================
medicalRecordSchema.index({ patient: 1 });
medicalRecordSchema.index({ "consultations.date": -1 });

// ==========================================
// 🔹 MIDDLEWARE: Update lastAccessed
// ==========================================
medicalRecordSchema.methods.recordAccess = function (userId) {
  this.lastAccessedBy = userId;
  this.lastAccessedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
