const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    // Lien vers le compte utilisateur (si le patient a un compte)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Numéro unique du patient
    numeroPatient: {
      type: String,
      unique: true,
    },

    // Informations personnelles
    nom: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est requis"],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },

    // Contact
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    telephone: {
      type: String,
      trim: true,
    },

    // Informations médicales
    dateNaissance: {
      type: Date,
    },
    sexe: {
      type: String,
      enum: ["Homme", "Femme", "Autre", "Non spécifié"],
      default: "Non spécifié",
    },
    groupeSanguin: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Non spécifié"],
      default: "Non spécifié",
    },

    // Adresse
    adresse: {
      type: String,
      trim: true,
    },
    ville: {
      type: String,
      trim: true,
    },
    codePostal: {
      type: String,
      trim: true,
    },

    // Informations d'urgence
    contactUrgence: {
      nom: String,
      telephone: String,
      relation: String,
    },

    // Médecin traitant
    medecinTraitant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // Historique médical
    antecedents: {
      type: String,
      trim: true,
    },
    allergies: {
      type: String,
      trim: true,
    },
    traitementEnCours: {
      type: String,
      trim: true,
    },

    // Assurance
    assurance: {
      compagnie: String,
      numeroPolice: String,
      validite: Date,
    },

    // Statut
    isActive: {
      type: Boolean,
      default: true,
    },

    // Notes internes
    notes: {
      type: String,
      trim: true,
    },

    // Audit
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

// Middleware: Générer le numéro de patient
patientSchema.pre("save", async function (next) {
  if (this.isNew && !this.numeroPatient) {
    const year = new Date().getFullYear();
    const count = await mongoose
      .model("Patient")
      .countDocuments({ numeroPatient: new RegExp(`^P${year}`) });
    this.numeroPatient = `P${year}${String(count + 1).padStart(5, "0")}`;
  }

  // Générer le champ 'name' si absent
  if (!this.name && this.prenom && this.nom) {
    this.name = `${this.prenom} ${this.nom}`;
  }

  next();
});

// Virtual: Calculer l'âge
patientSchema.virtual("age").get(function () {
  if (!this.dateNaissance) return null;
  const today = new Date();
  const birthDate = new Date(this.dateNaissance);
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

// Index
patientSchema.index({ numeroPatient: 1 });
patientSchema.index({ nom: 1, prenom: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ telephone: 1 });
patientSchema.index({ user: 1 });

patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

module.exports =
  mongoose.models.Patient || mongoose.model("Patient", patientSchema);
