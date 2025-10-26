const express = require("express");
const router = express.Router();
const Analysis = require("../models/Analysis");
const { protect, authorize } = require("../middleware/authMiddleware");

// ==========================================
// @route   GET /api/analyses
// @desc    Get all analyses (catalogue)
// @access  Private
// ==========================================
router.get("/", protect, async (req, res) => {
  try {
    const { category, isActive, search } = req.query;

    let filter = {};

    // Filter by category
    if (category && category !== "all") {
      filter.category = category;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const analyses = await Analysis.find(filter).sort({
      name: 1,
      createdAt: -1,
    });

    res.json(analyses);
  } catch (error) {
    console.error("Error fetching analyses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/analyses/categories
// @desc    Get analyses grouped by category
// @access  Private
// ==========================================
router.get("/categories", protect, async (req, res) => {
  try {
    const categories = await Analysis.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          analyses: { $push: "$$ROOT" },
          count: { $sum: 1 },
          totalPrice: { $sum: "$price" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/analyses/:id
// @desc    Get single analysis by ID
// @access  Private
// ==========================================
router.get("/:id", protect, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

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
// @route   POST /api/analyses
// @desc    Create new analysis
// @access  Private (Admin only)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const { code, name, category, price } = req.body;

      // Check if analysis with same code exists
      const existingAnalysis = await Analysis.findOne({ code });
      if (existingAnalysis) {
        return res.status(400).json({
          message: "Une analyse avec ce code existe déjà",
        });
      }

      // Create analysis
      const analysis = await Analysis.create({
        code,
        name,
        category,
        price,
        description: req.body.description || "",
        normalRange: req.body.normalRange || "",
        turnaroundTime: req.body.turnaroundTime || "24 hours",
        isActive: true,
      });

      res.status(201).json({
        message: "Analyse créée avec succès",
        analysis,
      });
    } catch (error) {
      console.error("Error creating analysis:", error.message);
      res.status(400).json({ message: error.message });
    }
  }
);

// ==========================================
// @route   PUT /api/analyses/:id
// @desc    Update analysis
// @access  Private (Admin only)
// ==========================================
router.put(
  "/:id",
  protect,
  authorize("admin", "receptionist"),
  async (req, res) => {
    try {
      const analysis = await Analysis.findById(req.params.id);

      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // If updating code, check if new code already exists
      if (req.body.code && req.body.code !== analysis.code) {
        const existingAnalysis = await Analysis.findOne({
          code: req.body.code,
        });
        if (existingAnalysis) {
          return res.status(400).json({
            message: "Une analyse avec ce code existe déjà",
          });
        }
      }

      const updatedAnalysis = await Analysis.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      res.json({
        message: "Analyse modifiée avec succès",
        analysis: updatedAnalysis,
      });
    } catch (error) {
      console.error("Error updating analysis:", error.message);
      res.status(400).json({ message: error.message });
    }
  }
);

// ==========================================
// @route   DELETE /api/analyses/:id
// @desc    Delete analysis (soft delete)
// @access  Private (Admin only)
// ==========================================
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ message: "Analysis not found" });
    }

    // Soft delete (désactiver au lieu de supprimer)
    analysis.isActive = false;
    await analysis.save();

    res.json({
      message: "Analyse désactivée avec succès",
      analysis,
    });
  } catch (error) {
    console.error("Error deleting analysis:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// @route   PATCH /api/analyses/:id/toggle-status
// @desc    Toggle analysis active status
// @access  Private (Admin only)
// ==========================================
router.patch(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const analysis = await Analysis.findById(req.params.id);

      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      analysis.isActive = !analysis.isActive;
      await analysis.save();

      res.json({
        message: `Analyse ${
          analysis.isActive ? "activée" : "désactivée"
        } avec succès`,
        analysis,
      });
    } catch (error) {
      console.error("Error toggling status:", error.message);
      res.status(500).json({ message: error.message });
    }
  }
);

// ==========================================
// @route   GET /api/analyses/stats/overview
// @desc    Get analyses statistics
// @access  Private
// ==========================================
router.get("/stats/overview", protect, async (req, res) => {
  try {
    const total = await Analysis.countDocuments();
    const active = await Analysis.countDocuments({ isActive: true });
    const inactive = await Analysis.countDocuments({ isActive: false });

    const byCategory = await Analysis.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      total,
      active,
      inactive,
      byCategory,
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================================
// @route   GET /api/analyses/mes-analyses
// @desc    Get analyses assigned to current patient
// @access  Private (Patient)
// ==========================================
router.get("/mes-analyses", protect, authorize("patient"), async (req, res) => {
  try {
    const analyses = await Analysis.find({ patient: req.user._id });
    res.json(analyses);
  } catch (error) {
    console.error("Error fetching patient's analyses:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
