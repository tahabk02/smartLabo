const Facture = require("../models/Facture");
const Patient = require("../models/Patient");

// 🧾 إنشاء فاتورة جديدة
const createFacture = async (req, res) => {
  try {
    const count = await Facture.countDocuments();
    const numeroFacture = `FAC${String(count + 1).padStart(6, "0")}`;

    const { patient, items, methodePaiement, notes } = req.body;

    const montantTotal = items.reduce((sum, i) => sum + i.montant, 0);

    const facture = new Facture({
      numeroFacture,
      patient,
      items,
      montantTotal,
      methodePaiement,
      notes,
      createdBy: req.user.id,
    });

    await facture.save();

    const populatedFacture = await Facture.findById(facture._id).populate(
      "patient",
      "nom prenom phone"
    );

    res.status(201).json(populatedFacture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📄 جلب جميع الفواتير
const getFactures = async (req, res) => {
  try {
    const { statut, patient, startDate, endDate } = req.query;

    let filter = {};
    if (statut) filter.statut = statut;
    if (patient) filter.patient = patient;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const factures = await Facture.find(filter)
      .populate("patient", "nom prenom phone")
      .sort({ createdAt: -1 });

    res.json(factures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 جلب فاتورة واحدة
const getFactureById = async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id).populate("patient");
    if (!facture)
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    res.json(facture);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✏️ تحديث فاتورة
const updateFacture = async (req, res) => {
  try {
    const facture = await Facture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("patient", "nom prenom");

    if (!facture)
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    res.json(facture);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 🗑️ حذف فاتورة
const deleteFacture = async (req, res) => {
  try {
    const facture = await Facture.findByIdAndDelete(req.params.id);
    if (!facture)
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    res.json({ message: "تم حذف الفاتورة بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 إحصائيات الفواتير
const getFactureStats = async (req, res) => {
  try {
    const stats = await Facture.aggregate([
      {
        $group: {
          _id: "$statut",
          total: { $sum: "$montantTotal" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFacture,
  getFactures,
  getFactureById,
  updateFacture,
  deleteFacture,
  getFactureStats,
};
