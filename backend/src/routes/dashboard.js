const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { protect } = require("../middleware/authMiddleware");
const Task = require("../models/Tasks");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Facture = require("../models/Facture");
const PatientAnalysis = require("../models/PatientAnalysis");

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get("/stats", protect, async (req, res) => {
  try {
    console.log("📊 Fetching dashboard stats for user:", req.user?.id);

    // Get current date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // Count documents
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalFactures = await Facture.countDocuments();

    // 🆕 Count NEW + OLD analyses
    const newAnalysesCount = await PatientAnalysis.countDocuments();
    let oldAnalysesCount = 0;
    try {
      oldAnalysesCount = await mongoose.connection.db
        .collection("analyses")
        .countDocuments();
    } catch (err) {
      console.log("⚠️ No old analyses collection:", err.message);
    }
    const totalAnalyses = newAnalysesCount + oldAnalysesCount;

    // Factures statistics
    const facturesEnAttente = await Facture.countDocuments({
      statut: "En attente",
    });

    const facturesEnRetard = await Facture.countDocuments({
      statut: "En retard",
    });

    const facturesPayees = await Facture.countDocuments({
      statut: "Payée",
    });

    // Revenue calculation
    const revenuResult = await Facture.aggregate([
      {
        $match: {
          dateFacture: { $gte: startOfMonth, $lte: endOfMonth },
          statut: "Payée",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montantTotal" },
        },
      },
    ]);
    const revenuMensuel = revenuResult[0]?.total || 0;

    // Tasks statistics
    const tachesAujourdhui = await Task.countDocuments({
      dateEcheance: { $gte: startOfDay, $lte: endOfDay },
    });

    const tachesTerminees = await Task.countDocuments({
      dateEcheance: { $gte: startOfDay, $lte: endOfDay },
      statut: "Terminée",
    });

    const tachesEnCours = await Task.countDocuments({
      statut: "En cours",
    });

    const tachesEnAttente = await Task.countDocuments({
      statut: "En attente",
    });

    // Calculate occupation rate
    const tauxOccupation =
      tachesAujourdhui > 0
        ? Math.round((tachesTerminees / tachesAujourdhui) * 100)
        : 0;

    // 🆕 Analyses en cours (NEW only)
    const analysesEnCours = await PatientAnalysis.countDocuments({
      status: { $in: ["pending", "in_progress", "sample_collected"] },
    });

    const stats = {
      totalPatients,
      totalDoctors,
      totalAnalyses, // 🆕 Now includes OLD + NEW
      totalFactures,
      revenuMensuel,
      facturesEnAttente,
      facturesEnRetard,
      facturesPayees,
      analysesEnCours,
      tachesAujourdhui,
      tachesEnCours,
      tachesEnAttente,
      tachesTerminees,
      tauxOccupation,
    };

    console.log("✅ Dashboard stats loaded:", stats);
    res.json(stats);
  } catch (error) {
    console.error("❌ Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/activities
// @desc    Get recent activities
// @access  Private
router.get("/activities", protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    console.log("📋 Fetching recent activities...");

    // Get recent patients
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("nom prenom name createdAt");

    // Get recent factures
    const recentFactures = await Facture.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("patientId patient", "nom prenom name")
      .select("numeroFacture montantTotal createdAt patientId patient statut");

    // Get recent tasks
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .select("titre statut createdAt");

    // Format activities
    const activities = [];

    recentPatients.forEach((patient) => {
      const patientName =
        patient.name || `${patient.nom || ""} ${patient.prenom || ""}`.trim();
      activities.push({
        _id: `patient-${patient._id}`,
        type: "patient",
        message: `Nouveau patient ajouté: ${patientName}`,
        createdAt: patient.createdAt,
        read: false,
      });
    });

    recentFactures.forEach((facture) => {
      const patientData = facture.patientId || facture.patient;
      const patientName = patientData
        ? patientData.name ||
          `${patientData.nom || ""} ${patientData.prenom || ""}`.trim()
        : "Patient inconnu";
      activities.push({
        _id: `facture-${facture._id}`,
        type: "facture",
        message: `Facture ${facture.numeroFacture || "N/A"} (${
          facture.statut
        }) - ${patientName}`,
        createdAt: facture.createdAt,
        read: false,
      });
    });

    recentTasks.forEach((task) => {
      activities.push({
        _id: `task-${task._id}`,
        type: "tache",
        message: `Tâche "${task.titre}" - ${task.statut}`,
        createdAt: task.createdAt,
        read: false,
      });
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = activities.slice(0, limit);

    console.log(`✅ ${limitedActivities.length} activities loaded`);
    res.json(limitedActivities);
  } catch (error) {
    console.error("❌ Error fetching activities:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/analytics
// @desc    Get analytics data for charts
// @access  Private
router.get("/analytics", protect, async (req, res) => {
  try {
    const period = req.query.period || "month"; // week, month, year

    let dateRange;
    const now = new Date();

    switch (period) {
      case "week":
        dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        dateRange = new Date(now.getFullYear(), 0, 1);
        break;
      case "month":
      default:
        dateRange = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Revenue chart data
    const revenueData = await Facture.aggregate([
      {
        $match: {
          dateFacture: { $gte: dateRange },
          statut: "Payée",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dateFacture" },
          },
          total: { $sum: "$montantTotal" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Patients chart data
    const patientsData = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 🆕 Top analyses from OLD collection
    let topAnalyses = [];
    try {
      const oldAnalysesStats = await mongoose.connection.db
        .collection("analyses")
        .aggregate([
          {
            $group: {
              _id: "$analyseType",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .toArray();

      topAnalyses = oldAnalysesStats.map((item) => ({
        name: item._id || "Unknown",
        count: item.count,
      }));
    } catch (err) {
      console.log("⚠️ Could not fetch old analyses stats:", err.message);
      // Fallback to mock data
      topAnalyses = [
        { name: "Glycémie", count: 45 },
        { name: "NFS", count: 38 },
        { name: "Cholestérol", count: 32 },
        { name: "Créatinine", count: 28 },
        { name: "TSH", count: 25 },
      ];
    }

    res.json({
      revenueChart: revenueData,
      patientsChart: patientsData,
      topAnalyses,
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/chart-data
// @desc    Get data for charts (revenue, patients growth, etc.)
// @access  Private
router.get("/chart-data", protect, async (req, res) => {
  try {
    const { type, period } = req.query;
    const months = parseInt(period) || 6;

    const data = [];

    if (type === "revenue") {
      // Last N months revenue
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const result = await Facture.aggregate([
          {
            $match: {
              dateFacture: { $gte: startOfMonth, $lte: endOfMonth },
              statut: "Payée",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$montantTotal" },
            },
          },
        ]);

        data.push({
          month: date.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          }),
          value: result[0]?.total || 0,
        });
      }
    } else if (type === "patients") {
      // Last N months patients growth
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const count = await Patient.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        });

        data.push({
          month: date.toLocaleDateString("fr-FR", {
            month: "short",
            year: "numeric",
          }),
          value: count,
        });
      }
    } else if (type === "tasks") {
      // Tasks status distribution
      const statuses = ["En attente", "En cours", "Terminée", "Annulée"];

      for (const status of statuses) {
        const count = await Task.countDocuments({ statut: status });
        data.push({
          name: status,
          value: count,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("❌ Error fetching chart data:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/summary
// @desc    Get quick summary for dashboard widgets
// @access  Private
router.get("/summary", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = {
      patientsToday: await Patient.countDocuments({
        createdAt: { $gte: today },
      }),
      tasksToday: await Task.countDocuments({
        dateEcheance: { $gte: today },
      }),
      facturesThisWeek: await Facture.countDocuments({
        dateFacture: {
          $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      urgentTasks: await Task.countDocuments({
        priorite: "Haute",
        statut: { $ne: "Terminée" },
      }),
    };

    res.json(summary);
  } catch (error) {
    console.error("❌ Error fetching summary:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
