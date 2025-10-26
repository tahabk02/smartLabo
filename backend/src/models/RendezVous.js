// models/RendezVous.js
const mongoose = require("mongoose");

const rendezVousSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateRdv: {
      type: Date,
      required: true,
    },
    analyses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Analysis",
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    statut: {
      type: String,
      enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RendezVous", rendezVousSchema);
