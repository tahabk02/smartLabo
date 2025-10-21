const Analyse = require("../models/Analyse");

const createAnalyse = async (req, res) => {
  try {
    const analyse = await Analyse.create(req.body);
    res.status(201).json(analyse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAnalyses = async (req, res) => {
  try {
    const { category, isActive, search } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const analyses = await Analyse.find(filter).sort({ name: 1 });
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnalyseById = async (req, res) => {
  try {
    const analyse = await Analyse.findById(req.params.id);

    if (!analyse) {
      return res.status(404).json({ message: "التحليل غير موجود" });
    }

    res.json(analyse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAnalyse = async (req, res) => {
  try {
    const analyse = await Analyse.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!analyse) {
      return res.status(404).json({ message: "التحليل غير موجود" });
    }

    res.json(analyse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// (soft delete)
const deleteAnalyse = async (req, res) => {
  try {
    const analyse = await Analyse.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!analyse) {
      return res.status(404).json({ message: "التحليل غير موجود" });
    }

    res.json({ message: "تم تعطيل التحليل بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAnalysesByCategory = async (req, res) => {
  try {
    const categories = await Analyse.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          analyses: { $push: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAnalyse,
  getAnalyses,
  getAnalyseById,
  updateAnalyse,
  deleteAnalyse,
  getAnalysesByCategory,
};
