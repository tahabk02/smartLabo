const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const { protect } = require("../middleware/authMiddleware");

// ==========================================
// @route   GET /api/medical-records/:patientId
// @desc    Get medical record for a patient
// @access  Private
// ==========================================
router.get("/:patientId", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    })
      .populate("patient", "firstName lastName numeroPatient bloodType age gender phone email")
      .populate("consultations.doctor", "name email")
      .populate("consultations.prescription")
      .populate("analyses")
      .populate("invoices")
      .populate("documents.uploadedBy", "name")
      .populate("generalNotes.author", "name")
      .populate("lastAccessedBy", "name");

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Record access
    if (medicalRecord.recordAccess) {
      await medicalRecord.recordAccess(req.user.id);
    }

    res.json(medicalRecord);
  } catch (error) {
    console.error("Error fetching medical record:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/medical-records/:patientId
// @desc    Create medical record for a patient
// @access  Private
// ==========================================
router.post("/:patientId", protect, async (req, res) => {
  try {
    // Check if patient exists
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if medical record already exists
    const existingRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });
    if (existingRecord) {
      return res
        .status(400)
        .json({ message: "Medical record already exists for this patient" });
    }

    const medicalRecord = new MedicalRecord({
      patient: req.params.patientId,
      ...req.body,
    });

    await medicalRecord.save();
    await medicalRecord.populate("patient", "firstName lastName numeroPatient");

    res.status(201).json(medicalRecord);
  } catch (error) {
    console.error("Error creating medical record:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/medical-records/:patientId/consultations
// @desc    Add consultation to medical record
// @access  Private
// ==========================================
router.post("/:patientId/consultations", protect, async (req, res) => {
  try {
    let medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    // Create medical record if doesn't exist
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({
        patient: req.params.patientId,
      });
    }

    const consultation = {
      ...req.body,
      doctor: req.user.id,
      date: req.body.date || new Date(),
    };

    medicalRecord.consultations.push(consultation);
    await medicalRecord.save();

    await medicalRecord.populate("consultations.doctor", "name email");

    res.status(201).json({
      message: "Consultation added successfully",
      consultation: medicalRecord.consultations[medicalRecord.consultations.length - 1],
    });
  } catch (error) {
    console.error("Error adding consultation:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/medical-records/:patientId/consultations/:consultationId
// @desc    Update consultation
// @access  Private
// ==========================================
router.put("/:patientId/consultations/:consultationId", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    const consultation = medicalRecord.consultations.id(req.params.consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    Object.assign(consultation, req.body);
    await medicalRecord.save();

    res.json({
      message: "Consultation updated successfully",
      consultation,
    });
  } catch (error) {
    console.error("Error updating consultation:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   DELETE /api/medical-records/:patientId/consultations/:consultationId
// @desc    Delete consultation
// @access  Private
// ==========================================
router.delete("/:patientId/consultations/:consultationId", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    medicalRecord.consultations.pull(req.params.consultationId);
    await medicalRecord.save();

    res.json({ message: "Consultation deleted successfully" });
  } catch (error) {
    console.error("Error deleting consultation:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/medical-records/:patientId/documents
// @desc    Upload document to medical record
// @access  Private
// ==========================================
router.post("/:patientId/documents", protect, async (req, res) => {
  try {
    let medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({
        patient: req.params.patientId,
      });
    }

    const document = {
      ...req.body,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    };

    medicalRecord.documents.push(document);
    await medicalRecord.save();

    res.status(201).json({
      message: "Document uploaded successfully",
      document: medicalRecord.documents[medicalRecord.documents.length - 1],
    });
  } catch (error) {
    console.error("Error uploading document:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   DELETE /api/medical-records/:patientId/documents/:documentId
// @desc    Delete document
// @access  Private
// ==========================================
router.delete("/:patientId/documents/:documentId", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    medicalRecord.documents.pull(req.params.documentId);
    await medicalRecord.save();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/medical-records/:patientId/notes
// @desc    Add general note
// @access  Private
// ==========================================
router.post("/:patientId/notes", protect, async (req, res) => {
  try {
    let medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({
        patient: req.params.patientId,
      });
    }

    const note = {
      content: req.body.content,
      author: req.user.id,
      isImportant: req.body.isImportant || false,
      createdAt: new Date(),
    };

    medicalRecord.generalNotes.push(note);
    await medicalRecord.save();

    await medicalRecord.populate("generalNotes.author", "name");

    res.status(201).json({
      message: "Note added successfully",
      note: medicalRecord.generalNotes[medicalRecord.generalNotes.length - 1],
    });
  } catch (error) {
    console.error("Error adding note:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   DELETE /api/medical-records/:patientId/notes/:noteId
// @desc    Delete note
// @access  Private
// ==========================================
router.delete("/:patientId/notes/:noteId", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    });

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    medicalRecord.generalNotes.pull(req.params.noteId);
    await medicalRecord.save();

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/medical-records/:patientId/timeline
// @desc    Get patient timeline (all events chronologically)
// @access  Private
// ==========================================
router.get("/:patientId/timeline", protect, async (req, res) => {
  try {
    const medicalRecord = await MedicalRecord.findOne({
      patient: req.params.patientId,
    })
      .populate("consultations.doctor", "name")
      .populate("analyses")
      .populate("invoices");

    if (!medicalRecord) {
      return res.status(404).json({ message: "Medical record not found" });
    }

    // Build timeline from all events
    const timeline = [];

    // Add consultations
    if (medicalRecord.consultations) {
      medicalRecord.consultations.forEach((consultation) => {
        timeline.push({
          type: "consultation",
          date: consultation.date,
          data: consultation,
        });
      });
    }

    // Add analyses
    if (medicalRecord.analyses) {
      medicalRecord.analyses.forEach((analysis) => {
        timeline.push({
          type: "analysis",
          date: analysis.requestDate,
          data: analysis,
        });
      });
    }

    // Add invoices
    if (medicalRecord.invoices) {
      medicalRecord.invoices.forEach((invoice) => {
        timeline.push({
          type: "invoice",
          date: invoice.invoiceDate,
          data: invoice,
        });
      });
    }

    // Add documents
    if (medicalRecord.documents) {
      medicalRecord.documents.forEach((doc) => {
        timeline.push({
          type: "document",
          date: doc.uploadedAt,
          data: doc,
        });
      });
    }

    // Sort by date (newest first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (error) {
    console.error("Error fetching timeline:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;