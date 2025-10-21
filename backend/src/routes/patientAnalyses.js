const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const PatientAnalysis = require("../models/PatientAnalysis");
const Analysis = require("../models/Analysis");
const Patient = require("../models/Patient");
const MedicalRecord = require("../models/MedicalRecord");
const { protect, authorize } = require("../middleware/authMiddleware");

// ==========================================
// HELPER FUNCTIONS FOR OLD DATA
// ==========================================
function mapOldStatus(oldStatus) {
  const statusMap = {
    traité: "completed",
    "en cours": "in_progress",
    "en attente": "pending",
    validé: "validated",
    livré: "delivered",
  };
  return statusMap[oldStatus?.toLowerCase()] || "completed";
}

function parseOldResults(resultOCR) {
  if (!resultOCR) return [];
  const parts = resultOCR.split(":");
  if (parts.length === 2) {
    const parameter = parts[0].trim();
    const valueWithUnit = parts[1].trim();
    const match = valueWithUnit.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      return [
        {
          parameter,
          value: match[1],
          unit: match[2] || "",
          isAbnormal: false,
          severity: "normal",
        },
      ];
    }
    return [
      {
        parameter,
        value: valueWithUnit,
        unit: "",
        isAbnormal: false,
        severity: "normal",
      },
    ];
  }
  return [];
}

// ==========================================
// @route   GET /api/patient-analyses
// @desc    Get all patient analyses
// @access  Private
// ==========================================
router.get("/", protect, async (req, res) => {
  try {
    const { status, patient, startDate, endDate } = req.query;

    let query = {};

    if (status) query.status = status;
    if (patient) query.patient = patient;
    if (startDate || endDate) {
      query.requestDate = {};
      if (startDate) query.requestDate.$gte = new Date(startDate);
      if (endDate) query.requestDate.$lte = new Date(endDate);
    }

    const analyses = await PatientAnalysis.find(query)
      .populate("patient", "firstName lastName numeroPatient phone")
      .populate("analysisType", "name code category price")
      .populate("prescribedBy", "name email")
      .populate("performedBy", "name")
      .populate("validatedBy", "name")
      .populate("createdBy", "name")
      .sort({ requestDate: -1 });

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching patient analyses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/patient-analyses/stats/overview
// @desc    Get analyses statistics
// @access  Private
// ==========================================
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const total = await PatientAnalysis.countDocuments();
    const pending = await PatientAnalysis.countDocuments({ status: "pending" });
    const inProgress = await PatientAnalysis.countDocuments({
      status: "in_progress",
    });
    const completed = await PatientAnalysis.countDocuments({
      status: "completed",
    });
    const validated = await PatientAnalysis.countDocuments({
      status: "validated",
    });
    const urgent = await PatientAnalysis.countDocuments({
      isUrgent: true,
      status: { $nin: ["delivered", "cancelled"] },
    });

    res.json({
      total,
      pending,
      inProgress,
      completed,
      validated,
      urgent,
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/patient-analyses/patient/:patientId
// @desc    Get all analyses for a specific patient (NEW + OLD data) 🔥
// @access  Private
// ==========================================
router.get("/patient/:patientId", protect, async (req, res) => {
  try {
    console.log(`🔍 Fetching analyses for patient: ${req.params.patientId}`);

    // 1. Fetch NEW analyses
    const newAnalyses = await PatientAnalysis.find({
      patient: req.params.patientId,
    })
      .populate("analysisType", "name code category price")
      .populate("prescribedBy", "name")
      .populate("validatedBy", "name")
      .sort({ requestDate: -1 });

    // 2. Fetch OLD analyses from legacy collection
    let oldAnalyses = [];
    try {
      const patientObjectId = new mongoose.Types.ObjectId(req.params.patientId);

      const oldData = await mongoose.connection.db
        .collection("analyses")
        .find({ patientId: patientObjectId })
        .toArray();

      oldAnalyses = oldData.map((analysis) => ({
        _id: analysis._id,
        analysisNumber: `OLD-${analysis._id.toString().slice(-6)}`,
        patient: analysis.patientId,
        analysisType: {
          name: analysis.analyseType || analysis.name || "Analyse",
          category: analysis.category || "Biochemistry",
          price: analysis.prix || analysis.price || 0,
        },
        requestDate: analysis.createdAt || new Date(),
        resultDate: analysis.updatedAt || new Date(),
        status: mapOldStatus(analysis.status),
        results: parseOldResults(analysis.resultOCR),
        interpretation: analysis.aiResult?.interpretation || "",
        conclusion: analysis.aiResult?.conclusion || "",
        reportPdf: {
          url: analysis.fileUrl,
          filename: analysis.fileUrl?.split("/").pop() || "",
        },
        price: analysis.prix || analysis.price || 0,
        paid: analysis.status === "traité",
        isLegacy: true,
      }));

      console.log(`✅ Found ${oldAnalyses.length} old analyses`);
    } catch (err) {
      console.log("⚠️ No old analyses:", err.message);
    }

    // 3. Combine and sort
    const allAnalyses = [...newAnalyses, ...oldAnalyses].sort(
      (a, b) => new Date(b.requestDate) - new Date(a.requestDate)
    );

    console.log(
      `📊 Total: ${allAnalyses.length} (${newAnalyses.length} new + ${oldAnalyses.length} old)`
    );

    res.json(allAnalyses);
  } catch (error) {
    console.error("Error fetching patient analyses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/patient-analyses/:id
// @desc    Get single patient analysis
// @access  Private
// ==========================================
router.get("/:id", protect, async (req, res) => {
  try {
    const analysis = await PatientAnalysis.findById(req.params.id)
      .populate(
        "patient",
        "firstName lastName numeroPatient age gender phone email bloodType"
      )
      .populate(
        "analysisType",
        "name code category price description normalRange"
      )
      .populate("prescribedBy", "name email")
      .populate("performedBy", "name")
      .populate("validatedBy", "name")
      .populate("invoice");

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    res.json(analysis);
  } catch (error) {
    console.error("Error fetching analysis:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   POST /api/patient-analyses
// @desc    Create new patient analysis
// @access  Private
// ==========================================
router.post("/", protect, async (req, res) => {
  try {
    const { patient, analysisType, ...otherData } = req.body;

    const patientExists = await Patient.findById(patient);
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const analysisTypeExists = await Analysis.findById(analysisType);
    if (!analysisTypeExists) {
      return res.status(404).json({ message: "Analysis type not found" });
    }

    const patientAnalysis = new PatientAnalysis({
      patient,
      analysisType,
      price: analysisTypeExists.price,
      ...otherData,
      createdBy: req.user.id,
    });

    await patientAnalysis.save();

    let medicalRecord = await MedicalRecord.findOne({ patient });
    if (!medicalRecord) {
      medicalRecord = new MedicalRecord({ patient });
    }
    medicalRecord.analyses.push(patientAnalysis._id);
    await medicalRecord.save();

    await patientAnalysis.populate([
      { path: "patient", select: "firstName lastName numeroPatient" },
      { path: "analysisType", select: "name code category price" },
      { path: "prescribedBy", select: "name" },
    ]);

    res.status(201).json(patientAnalysis);
  } catch (error) {
    console.error("Error creating patient analysis:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/patient-analyses/:id
// @desc    Update patient analysis
// @access  Private
// ==========================================
router.put("/:id", protect, async (req, res) => {
  try {
    const analysis = await PatientAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    Object.assign(analysis, req.body);
    analysis.updatedBy = req.user.id;
    await analysis.save();

    await analysis.populate([
      { path: "patient", select: "firstName lastName numeroPatient" },
      { path: "analysisType", select: "name code category" },
      { path: "validatedBy", select: "name" },
    ]);

    res.json(analysis);
  } catch (error) {
    console.error("Error updating analysis:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/patient-analyses/:id/status
// @desc    Update analysis status
// @access  Private
// ==========================================
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const analysis = await PatientAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    analysis.status = status;
    analysis.updatedBy = req.user.id;

    if (status === "validated") {
      analysis.validatedBy = req.user.id;
      analysis.validatedAt = new Date();
      analysis.resultDate = new Date();
    }

    await analysis.save();
    res.json({ message: "Status updated successfully", analysis });
  } catch (error) {
    console.error("Error updating status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/patient-analyses/:id/results
// @desc    Add/Update analysis results
// @access  Private
// ==========================================
router.put("/:id/results", protect, async (req, res) => {
  try {
    const { results, interpretation, conclusion, recommendations } = req.body;
    const analysis = await PatientAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    analysis.results = results;
    analysis.interpretation = interpretation;
    analysis.conclusion = conclusion;
    analysis.recommendations = recommendations;
    analysis.status = "completed";
    analysis.resultDate = new Date();
    analysis.performedBy = req.user.id;
    analysis.updatedBy = req.user.id;

    await analysis.save();
    res.json({ message: "Results added successfully", analysis });
  } catch (error) {
    console.error("Error adding results:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   PUT /api/patient-analyses/:id/validate
// @desc    Validate analysis
// @access  Private (admin, doctor)
// ==========================================
router.put(
  "/:id/validate",
  protect,
  authorize("admin", "doctor"),
  async (req, res) => {
    try {
      const analysis = await PatientAnalysis.findById(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      if (analysis.status !== "completed") {
        return res
          .status(400)
          .json({ message: "Analysis must be completed before validation" });
      }

      analysis.status = "validated";
      analysis.validatedBy = req.user.id;
      analysis.validatedAt = new Date();
      analysis.updatedBy = req.user.id;

      await analysis.save();
      res.json({ message: "Analysis validated successfully", analysis });
    } catch (error) {
      console.error("Error validating analysis:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ==========================================
// @route   DELETE /api/patient-analyses/:id
// @desc    Delete patient analysis
// @access  Private (admin only)
// ==========================================
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const analysis = await PatientAnalysis.findById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    await MedicalRecord.updateOne(
      { patient: analysis.patient },
      { $pull: { analyses: analysis._id } }
    );

    await analysis.deleteOne();
    res.json({ message: "Analysis deleted successfully" });
  } catch (error) {
    console.error("Error deleting analysis:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
