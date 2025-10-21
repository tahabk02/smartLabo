const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Facture = require("../models/Facture");
const { protect, authorize } = require("../middleware/authMiddleware");

// -------------------------------------
// Create a new appointment (Patient)
// -------------------------------------
router.post("/", protect, authorize("patient"), async (req, res) => {
  try {
    const { date, analyses, notes } = req.body;

    const appointment = new Appointment({
      patient: req.user.id,
      date,
      analyses,
      notes,
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------------
// Get all appointments (Admin, Doctor, Nurse)
// -------------------------------------
router.get(
  "/",
  protect,
  authorize("admin", "doctor", "nurse"),
  async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .populate("patient", "nom prenom numeroPatient phone email")
        .populate("facture")
        .sort({ date: 1 });

      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// -------------------------------------
// Get a single appointment by ID
// -------------------------------------
router.get("/:id", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "nom prenom numeroPatient phone email")
      .populate("facture");

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------------------------
// Confirm an appointment (Admin, Doctor, Nurse)
// Generates a Facture automatically
// -------------------------------------
router.put(
  "/:id/confirm",
  protect,
  authorize("admin", "doctor", "nurse"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id).populate(
        "patient"
      );

      if (!appointment)
        return res.status(404).json({ message: "Appointment not found" });

      appointment.status = "confirmed";
      appointment.confirmedBy = req.user.id;

      // Generate facture
      const count = await Facture.countDocuments();
      const numeroFacture = `FAC${new Date().getFullYear()}${String(
        count + 1
      ).padStart(5, "0")}`;

      const items = appointment.analyses.map((analyse) => ({
        designation: analyse,
        quantite: 1,
        prixUnitaire: 0, // later set price if you have price list
        montant: 0,
      }));

      const montantTotal = items.reduce((sum, i) => sum + i.montant, 0);

      const facture = new Facture({
        numeroFacture,
        patient: appointment.patient._id,
        items,
        montantTotal,
        statut: "en attente",
        createdBy: req.user.id,
      });

      await facture.save();
      appointment.facture = facture._id;

      await appointment.save();

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate("patient", "nom prenom numeroPatient")
        .populate("facture");

      res.json({
        message: "Appointment confirmed and facture generated",
        populatedAppointment,
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// -------------------------------------
// Cancel an appointment
// -------------------------------------
router.put(
  "/:id/cancel",
  protect,
  authorize("admin", "doctor", "nurse"),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment)
        return res.status(404).json({ message: "Appointment not found" });

      appointment.status = "cancelled";
      await appointment.save();

      res.json({ message: "Appointment cancelled", appointment });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// -------------------------------------
// Delete an appointment
// -------------------------------------
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
