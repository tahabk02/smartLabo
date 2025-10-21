const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const AnalyseType = require("../models/AnalyseType");

// @route   GET /api/analyse-types
// @desc    Get all analyse types
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { category, isActive } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const analyseTypes = await AnalyseType.find(query).sort({ name: 1 });

    console.log(`✅ Found ${analyseTypes.length} analyse types`);
    res.json(analyseTypes);
  } catch (error) {
    console.error("❌ Error fetching analyse types:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des types d'analyses",
      error: error.message,
    });
  }
});

// @route   GET /api/analyse-types/search
// @desc    Search analyse types
// @access  Private
router.get("/search", protect, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res
        .status(400)
        .json({ message: "Le paramètre de recherche est requis" });
    }

    const analyseTypes = await AnalyseType.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ],
      isActive: true,
    }).sort({ name: 1 });

    res.json(analyseTypes);
  } catch (error) {
    console.error("❌ Error searching analyse types:", error);
    res.status(500).json({
      message: "Erreur lors de la recherche",
      error: error.message,
    });
  }
});

// @route   GET /api/analyse-types/:id
// @desc    Get analyse type by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const analyseType = await AnalyseType.findById(req.params.id);

    if (!analyseType) {
      return res.status(404).json({ message: "Type d'analyse non trouvé" });
    }

    res.json(analyseType);
  } catch (error) {
    console.error("❌ Error fetching analyse type:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération du type d'analyse",
      error: error.message,
    });
  }
});

// @route   POST /api/analyse-types
// @desc    Create new analyse type
// @access  Private (Admin only)
router.post("/", protect, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      category,
      normalRange,
      turnaroundTime,
    } = req.body;

    // Vérifier si le type d'analyse existe déjà
    const existingAnalyseType = await AnalyseType.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingAnalyseType) {
      return res.status(400).json({
        message: "Un type d'analyse avec ce nom existe déjà",
      });
    }

    const analyseType = await AnalyseType.create({
      name,
      description,
      price,
      unit,
      category,
      normalRange,
      turnaroundTime,
    });

    console.log(`✅ Analyse type created: ${analyseType.name}`);
    res.status(201).json(analyseType);
  } catch (error) {
    console.error("❌ Error creating analyse type:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Données invalides",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Erreur lors de la création du type d'analyse",
      error: error.message,
    });
  }
});

// @route   PUT /api/analyse-types/:id
// @desc    Update analyse type
// @access  Private (Admin only)
router.put("/:id", protect, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      unit,
      category,
      normalRange,
      turnaroundTime,
      isActive,
    } = req.body;

    const analyseType = await AnalyseType.findById(req.params.id);

    if (!analyseType) {
      return res.status(404).json({ message: "Type d'analyse non trouvé" });
    }

    // Vérifier si le nouveau nom n'existe pas déjà (sauf pour l'actuel)
    if (name && name !== analyseType.name) {
      const existingAnalyseType = await AnalyseType.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: req.params.id },
      });

      if (existingAnalyseType) {
        return res.status(400).json({
          message: "Un type d'analyse avec ce nom existe déjà",
        });
      }
    }

    // Mettre à jour les champs
    if (name) analyseType.name = name;
    if (description !== undefined) analyseType.description = description;
    if (price) analyseType.price = price;
    if (unit !== undefined) analyseType.unit = unit;
    if (category) analyseType.category = category;
    if (normalRange) analyseType.normalRange = normalRange;
    if (turnaroundTime) analyseType.turnaroundTime = turnaroundTime;
    if (isActive !== undefined) analyseType.isActive = isActive;

    const updatedAnalyseType = await analyseType.save();

    console.log(`✅ Analyse type updated: ${updatedAnalyseType.name}`);
    res.json(updatedAnalyseType);
  } catch (error) {
    console.error("❌ Error updating analyse type:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Données invalides",
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      message: "Erreur lors de la mise à jour du type d'analyse",
      error: error.message,
    });
  }
});

// @route   DELETE /api/analyse-types/:id
// @desc    Delete analyse type
// @access  Private (Admin only)
router.delete("/:id", protect, async (req, res) => {
  try {
    const analyseType = await AnalyseType.findById(req.params.id);

    if (!analyseType) {
      return res.status(404).json({ message: "Type d'analyse non trouvé" });
    }

    // Au lieu de supprimer, on peut désactiver
    // analyseType.isActive = false;
    // await analyseType.save();

    // Ou supprimer complètement
    await analyseType.deleteOne();

    console.log(`✅ Analyse type deleted: ${analyseType.name}`);
    res.json({ message: "Type d'analyse supprimé avec succès" });
  } catch (error) {
    console.error("❌ Error deleting analyse type:", error);
    res.status(500).json({
      message: "Erreur lors de la suppression du type d'analyse",
      error: error.message,
    });
  }
});

// @route   GET /api/analyse-types/stats/summary
// @desc    Get analyse types statistics
// @access  Private
router.get("/stats/summary", protect, async (req, res) => {
  try {
    const totalTypes = await AnalyseType.countDocuments();
    const activeTypes = await AnalyseType.countDocuments({ isActive: true });

    const categoryStats = await AnalyseType.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const priceStats = await AnalyseType.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
        },
      },
    ]);

    res.json({
      totalTypes,
      activeTypes,
      categoryStats,
      priceStats: priceStats[0] || { minPrice: 0, maxPrice: 0, avgPrice: 0 },
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

module.exports = router;
