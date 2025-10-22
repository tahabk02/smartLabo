// backend/models/User.js - Extended version with Patient Portal features

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // ========== BASIC INFO (Existant) ==========
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist", "patient"],
      default: "patient",
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ========== PATIENT SPECIFIC (✨ New) ==========
    // S'applique uniquement si role = 'patient'

    patientInfo: {
      // Numéro Patient (généré automatiquement)
      numeroPatient: {
        type: String,
        unique: true,
        sparse: true, // Permet null pour non-patients
      },

      // Informations personnelles
      firstName: String,
      lastName: String,
      cin: {
        type: String,
        unique: true,
        sparse: true,
      },
      birthDate: Date,
      gender: {
        type: String,
        enum: ["male", "female", "other", ""],
      },

      // Informations médicales
      medicalInfo: {
        bloodType: {
          type: String,
          enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
        },
        height: Number, // cm
        weight: Number, // kg
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
      },

      // Contact d'urgence
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
        email: String,
      },

      // Médecin traitant
      prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Référence vers un doctor
      },
    },

    // ========== NFC CARD SYSTEM (✨ New) ==========
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

    // ========== PREFERENCES (✨ New) ==========
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

    // ========== STATISTICS ==========
    stats: {
      totalAppointments: { type: Number, default: 0 },
      totalAnalyses: { type: Number, default: 0 },
      totalInvoices: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
    },

    lastLogin: Date,
    avatar: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========== INDEXES ==========
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "patientInfo.numeroPatient": 1 });
userSchema.index({ "patientInfo.cin": 1 });
userSchema.index({ "nfc.cardNumber": 1 });
userSchema.index({ "nfc.token": 1 });

// ========== VIRTUAL FIELDS ==========

// Full name
userSchema.virtual("fullName").get(function () {
  if (
    this.role === "patient" &&
    this.patientInfo?.firstName &&
    this.patientInfo?.lastName
  ) {
    return `${this.patientInfo.firstName} ${this.patientInfo.lastName}`;
  }
  return this.name;
});

// Age (for patients)
userSchema.virtual("age").get(function () {
  if (!this.patientInfo?.birthDate) return null;

  const today = new Date();
  const birthDate = new Date(this.patientInfo.birthDate);
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

// BMI (for patients)
userSchema.virtual("bmi").get(function () {
  const height = this.patientInfo?.medicalInfo?.height;
  const weight = this.patientInfo?.medicalInfo?.weight;

  if (!height || !weight) return null;

  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
});

// ========== PRE-SAVE MIDDLEWARE ==========

userSchema.pre("save", async function (next) {
  // Hash password si modifié
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Générer numeroPatient pour les nouveaux patients
  if (
    this.isNew &&
    this.role === "patient" &&
    !this.patientInfo?.numeroPatient
  ) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);

    if (!this.patientInfo) this.patientInfo = {};
    this.patientInfo.numeroPatient = `PAT-${year}${month}${day}-${random}`;
  }

  next();
});

// ========== INSTANCE METHODS ==========

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate NFC Token
userSchema.methods.generateNFCToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  this.nfc.token = hash;
  this.nfc.issuedAt = new Date();
  this.nfc.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
  this.nfc.status = "active";

  return token; // Return original token (not hashed)
};

// Generate Card Number
userSchema.methods.generateCardNumber = function () {
  const prefix = "NFC";
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(100000 + Math.random() * 900000);
  this.nfc.cardNumber = `${prefix}${year}${random}`;
  return this.nfc.cardNumber;
};

// Suspend NFC Card
userSchema.methods.suspendNFCCard = function () {
  this.nfc.status = "suspended";
  return this.save();
};

// Reactivate NFC Card
userSchema.methods.reactivateNFCCard = function () {
  if (this.nfc.status === "suspended") {
    this.nfc.status = "active";
  }
  return this.save();
};

// Report NFC Lost
userSchema.methods.reportNFCLost = function () {
  this.nfc.status = "lost";
  this.nfc.token = null; // Invalider le token
  return this.save();
};

// Get Public Info (for NFC scan)
userSchema.methods.getPublicInfo = function () {
  if (this.role !== "patient") {
    return {
      message: "Cette carte n'est pas associée à un patient",
    };
  }

  return {
    numeroPatient: this.patientInfo?.numeroPatient,
    fullName: this.fullName,
    age: this.age,
    gender: this.patientInfo?.gender,
    bloodType: this.patientInfo?.medicalInfo?.bloodType,
    allergies: this.patientInfo?.medicalInfo?.allergies || [],
    chronicDiseases: this.patientInfo?.medicalInfo?.chronicDiseases || [],
    emergencyContact: this.patientInfo?.emergencyContact,
    photo: this.avatar || null,
  };
};

// ========== STATIC METHODS ==========

// Find by NFC Token
userSchema.statics.findByNFCToken = async function (token) {
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  return await this.findOne({
    "nfc.token": hash,
    "nfc.status": "active",
    "nfc.expiresAt": { $gt: new Date() },
    role: "patient",
  });
};

// Search patients
userSchema.statics.searchPatients = function (query) {
  const searchRegex = new RegExp(query, "i");

  return this.find({
    role: "patient",
    $or: [
      { name: searchRegex },
      { "patientInfo.firstName": searchRegex },
      { "patientInfo.lastName": searchRegex },
      { email: searchRegex },
      { "patientInfo.numeroPatient": searchRegex },
      { "patientInfo.cin": searchRegex },
    ],
  });
};

const User = mongoose.model("User", userSchema);

module.exports = User;
