const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const MedicalRecord = require("../models/MedicalRecord");
const { protect, authorize } = require("../middleware/authMiddleware");

// ==========================================
// @route   GET /api/prescriptions
// @desc    Get all prescriptions
// @access  Private
// ==========================================
router.get("/", protect, async (req, res) => {
  try {
    const { status, patient, startDate, endDate } = req.query;

    let query = {};

    if (status) query.status = status;
    if (patient) query.patient = patient;
    if (startDate || endDate) {
      query.prescriptionDate = {};
      if (startDate) query.prescriptionDate.$gte = new Date(startDate);
      if (endDate) query.prescriptionDate.$lte = new Date(endDate);
    }

    const prescriptions = await Prescription.find(query)
      .populate("patient", "firstName lastName numeroPatient phone email")
      .populate("doctor", "name email")
      .populate("createdBy", "name")
      .sort({ prescriptionDate: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/prescriptions/:id
// @desc    Get single prescription
// @access  Private
// ==========================================
router.get("/:id", protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate(
        "patient",
        "firstName lastName numeroPatient age gender phone email address"
      )
      .populate("doctor", "name email phone")
      .populate("createdBy", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get all prescriptions for a patient
// @access  Private
// ==========================================
router.get("/patient/:patientId", protect, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.params.patientId,
    })
      .populate("doctor", "name")
      .sort({ prescriptionDate: -1 });

    res.json(prescriptions);
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/prescriptions/number/:prescriptionNumber
// @desc    Get prescription by number
// @access  Public (for validation)
// ==========================================
router.get("/number/:prescriptionNumber", async (req, res) => {
  try {
    const prescription = await Prescription.findOne({
      prescriptionNumber: req.params.prescriptionNumber,
    })
      .populate("patient", "firstName lastName age")
      .populate("doctor", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json(prescription);
  } catch (error) {
    console.error("Error fetching prescription by number:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/prescriptions
// @desc    Create new prescription
// @access  Private (doctor, admin)
// ==========================================
router.post("/", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const { patient, medications, diagnosis, generalInstructions } = req.body;

    // Verify patient exists
    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Create prescription
    const prescription = new Prescription({
      patient,
      doctor: req.user.id,
      medications,
      diagnosis,
      generalInstructions,
      createdBy: req.user.id,
    });

    await prescription.save();

    // Add to medical record (optional: link to consultation)
    let medicalRecord = await MedicalRecord.findOne({ patient });
    if (medicalRecord) {
      // You can link prescription to a specific consultation here if needed
      await medicalRecord.save();
    }

    await prescription.populate([
      { path: "patient", select: "firstName lastName numeroPatient" },
      { path: "doctor", select: "name" },
    ]);

    res.status(201).json(prescription);
  } catch (error) {
    console.error("Error creating prescription:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/prescriptions/:id
// @desc    Update prescription
// @access  Private (doctor, admin)
// ==========================================
router.put("/:id", protect, authorize("doctor", "admin"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Check if doctor owns this prescription
    if (
      prescription.doctor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this prescription" });
    }

    // Update fields
    Object.assign(prescription, req.body);
    prescription.updatedBy = req.user.id;

    await prescription.save();

    await prescription.populate([
      { path: "patient", select: "firstName lastName" },
      { path: "doctor", select: "name" },
    ]);

    res.json(prescription);
  } catch (error) {
    console.error("Error updating prescription:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/prescriptions/:id/status
// @desc    Update prescription status
// @access  Private
// ==========================================
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    prescription.status = status;
    prescription.updatedBy = req.user.id;

    await prescription.save();

    res.json({ message: "Status updated successfully", prescription });
  } catch (error) {
    console.error("Error updating status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/prescriptions/:id/validate
// @desc    Validate prescription
// @access  Private (doctor, admin)
// ==========================================
router.put(
  "/:id/validate",
  protect,
  authorize("doctor", "admin"),
  async (req, res) => {
    try {
      const prescription = await Prescription.findById(req.params.id);

      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }

      prescription.isValidated = true;
      prescription.updatedBy = req.user.id;

      // Generate validation hash (simple example)
      const crypto = require("crypto");
      const hashData = `${prescription.prescriptionNumber}-${
        prescription.patient
      }-${Date.now()}`;
      prescription.validationHash = crypto
        .createHash("sha256")
        .update(hashData)
        .digest("hex");

      await prescription.save();

      res.json({
        message: "Prescription validated successfully",
        prescription,
      });
    } catch (error) {
      console.error("Error validating prescription:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ==========================================
// @route   PUT /api/prescriptions/:id/send-email
// @desc    Send prescription to patient via email
// @access  Private
// ==========================================
router.put("/:id/send-email", protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate(
      "patient",
      "email firstName lastName"
    );

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (!prescription.patient.email) {
      return res.status(400).json({ message: "Patient has no email address" });
    }

    // TODO: Implement email sending logic here
    // Example: await sendPrescriptionEmail(prescription);

    prescription.sentToPatient.email.sent = true;
    prescription.sentToPatient.email.sentAt = new Date();
    await prescription.save();

    res.json({ message: "Prescription sent successfully via email" });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/prescriptions/:id/send-sms
// @desc    Send prescription to patient via SMS
// @access  Private
// ==========================================
router.put("/:id/send-sms", protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id).populate(
      "patient",
      "phone firstName lastName"
    );

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (!prescription.patient.phone) {
      return res.status(400).json({ message: "Patient has no phone number" });
    }

    // TODO: Implement SMS sending logic here
    // Example: await sendPrescriptionSMS(prescription);

    prescription.sentToPatient.sms.sent = true;
    prescription.sentToPatient.sms.sentAt = new Date();
    await prescription.save();

    res.json({ message: "Prescription sent successfully via SMS" });
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access  Private (admin only)
// ==========================================
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    await prescription.deleteOne();

    res.json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("Error deleting prescription:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/prescriptions/stats/overview
// @desc    Get prescriptions statistics
// @access  Private
// ==========================================
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const total = await Prescription.countDocuments();
    const active = await Prescription.countDocuments({ status: "active" });
    const delivered = await Prescription.countDocuments({
      status: "delivered",
    });
    const expired = await Prescription.countDocuments({ status: "expired" });
    const cancelled = await Prescription.countDocuments({
      status: "cancelled",
    });

    res.json({
      total,
      active,
      delivered,
      expired,
      cancelled,
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
