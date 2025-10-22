const mongoose = require("mongoose");

const nfcScanSchema = new mongoose.Schema({
  card: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NFCCard",
    required: true,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // الطبيب أو موظف الاستقبال
  },
  location: String, // اختيارية: مثلاً "Accueil" أو "Laboratoire"
  scannedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NFCScan", nfcScanSchema);
