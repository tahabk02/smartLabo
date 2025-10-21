// models/Appointment.js (Backend MongoDB Model)
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    analyses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Analysis",
        required: true,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "done"],
      default: "pending",
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    facture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facture",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour recherche rapide
appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
