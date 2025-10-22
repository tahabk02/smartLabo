// backend/models/Patient.js - Updated Version avec NFC Support

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const patientSchema = new mongoose.Schema(
  {
    // ========== Basic Information ==========
    numeroPatient: {
      type: String,
      required: true,
      unique: true,
      // Auto-generate: PAT-YYYYMMDD-XXXX
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    cin: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    // ========== Contact Information ==========
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: "Morocco" },
    },

    // ========== Authentication ✨ NEW ==========
    password: {
      type: String,
      required: true,
      select: false, // Ne pas renvoyer par défaut
    },
    role: {
      type: String,
      default: "patient",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,

    // ========== Medical Information ✨ NEW ==========
    medicalInfo: {
      bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      },
      height: Number, // en cm
      weight: Number, // en kg
      allergies: [
        {
          name: String,
          severity: {
            type: String,
            enum: ["mild", "moderate", "severe"],
          },
          notes: String,
        },
      ],
      chronicDiseases: [
        {
          name: String,
          diagnosedDate: Date,
          notes: String,
        },
      ],
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          startDate: Date,
          endDate: Date,
        },
      ],
      surgeries: [
        {
          name: String,
          date: Date,
          hospital: String,
          notes: String,
        },
      ],
      vaccinations: [
        {
          name: String,
          date: Date,
          nextDue: Date,
        },
      ],
    },

    // ========== Emergency Contact ✨ NEW ==========
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },

    // ========== NFC Card System ✨ NEW ==========
    nfc: {
      cardNumber: {
        type: String,
        unique: true,
        sparse: true,
      },
      token: {
        type: String,
        unique: true,
        sparse: true,
      },
      qrCode: String, // Data URI du QR code
      issuedAt: Date,
      expiresAt: Date,
      status: {
        type: String,
        enum: ["active", "suspended", "expired", "lost", "not_issued"],
        default: "not_issued",
      },
      lastScanned: {
        date: Date,
        location: String,
        scannedBy: String,
      },
    },

    // ========== Preferences & Settings ✨ NEW ==========
    preferences: {
      language: {
        type: String,
        enum: ["fr", "ar", "en"],
        default: "fr",
      },
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      reminders: {
        appointments: { type: Boolean, default: true },
        medications: { type: Boolean, default: false },
        results: { type: Boolean, default: true },
      },
    },

    // ========== Relations ==========
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // ========== Statistics ==========
    stats: {
      totalAppointments: { type: Number, default: 0 },
      totalAnalyses: { type: Number, default: 0 },
      totalInvoices: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== Indexes ==========
patientSchema.index({ email: 1 });
patientSchema.index({ numeroPatient: 1 });
patientSchema.index({ cin: 1 });
patientSchema.index({ "nfc.cardNumber": 1 });
patientSchema.index({ "nfc.token": 1 });

// ========== Virtual Fields ==========
patientSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

patientSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

patientSchema.virtual("bmi").get(function () {
  if (!this.medicalInfo.height || !this.medicalInfo.weight) return null;
  const heightInMeters = this.medicalInfo.height / 100;
  return (this.medicalInfo.weight / (heightInMeters * heightInMeters)).toFixed(
    1
  );
});

// ========== Pre-save Middleware ==========
// Hash password avant de sauvegarder
patientSchema.pre("save", async function (next) {
  // Hash password si modifié
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Générer numeroPatient si nouveau
  if (this.isNew && !this.numeroPatient) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    this.numeroPatient = `PAT-${year}${month}${day}-${random}`;
  }

  next();
});

// ========== Instance Methods ==========

// Comparer le password
patientSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Générer NFC Token
patientSchema.methods.generateNFCToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  this.nfc.token = hash;
  this.nfc.issuedAt = new Date();
  this.nfc.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
  this.nfc.status = "active";

  return token; // Return original token (not hashed)
};

// Générer Card Number
patientSchema.methods.generateCardNumber = function () {
  const prefix = "NFC";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(100000 + Math.random() * 900000);
  this.nfc.cardNumber = `${prefix}${year}${random}`;
  return this.nfc.cardNumber;
};

// Suspendre la carte NFC
patientSchema.methods.suspendNFCCard = function (reason) {
  this.nfc.status = "suspended";
  return this.save();
};

// Réactiver la carte NFC
patientSchema.methods.reactivateNFCCard = function () {
  if (this.nfc.status === "suspended") {
    this.nfc.status = "active";
  }
  return this.save();
};

// Signaler carte perdue
patientSchema.methods.reportNFCLost = function () {
  this.nfc.status = "lost";
  // Invalider le token actuel
  this.nfc.token = null;
  return this.save();
};

// Obtenir les infos publiques (pour NFC scan)
patientSchema.methods.getPublicInfo = function () {
  return {
    numeroPatient: this.numeroPatient,
    fullName: this.fullName,
    age: this.age,
    gender: this.gender,
    bloodType: this.medicalInfo.bloodType,
    allergies: this.medicalInfo.allergies,
    chronicDiseases: this.medicalInfo.chronicDiseases,
    emergencyContact: this.emergencyContact,
    photo: this.photo || null,
  };
};

// ========== Static Methods ==========

// Trouver par NFC Token
patientSchema.statics.findByNFCToken = async function (token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return await this.findOne({
    "nfc.token": hash,
    "nfc.status": "active",
    "nfc.expiresAt": { $gt: new Date() },
  });
};

// Recherche patients
patientSchema.statics.searchPatients = function (query) {
  const searchRegex = new RegExp(query, "i");
  return this.find({
    $or: [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { numeroPatient: searchRegex },
      { cin: searchRegex },
    ],
  });
};

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
