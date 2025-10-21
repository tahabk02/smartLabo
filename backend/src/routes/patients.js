const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const { protect, authorize } = require("../middleware/authMiddleware"); // ✅ Correct import

// ----------------------------
// @route   GET /api/patients
// @desc    Get all patients
// @access  Private
// ----------------------------
router.get("/", protect, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------
// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
// ----------------------------
router.get("/:id", protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------
// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (admin, receptionist)
// ----------------------------
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const count = await Patient.countDocuments();
      const numeroPatient = `PAT${String(count + 1).padStart(6, "0")}`;

      const patient = new Patient({
        ...req.body,
        numeroPatient,
      });

      await patient.save();
      res.status(201).json(patient);
    } catch (error) {
      console.error("Error creating patient:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (admin, receptionist)
// ----------------------------
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      res.json(patient);
    } catch (error) {
      console.error("Error updating patient:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ----------------------------
// @route   DELETE /api/patients/:id
// @desc    Delete patient
// @access  Private (admin only)
// ----------------------------
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("Error deleting patient:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
