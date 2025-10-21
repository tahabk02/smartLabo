const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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
      select: false, // Ne pas inclure le password par défaut dans les queries
    },
    role: {
      type: String,
      enum: ["admin", "receptionist", "patient", "technician", "doctor"],
      default: "patient",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Lien vers le profil patient si role = "patient"
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    // Photo de profil
    avatar: {
      type: String,
    },
    // Téléphone
    phone: {
      type: String,
    },
    // Date de dernière connexion
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Middleware: Mettre à jour lastLogin lors de la connexion
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
