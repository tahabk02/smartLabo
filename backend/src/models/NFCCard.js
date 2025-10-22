// 5. backend/src/models/NFCCard.js
// ==========================================
const nfcCardSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  qrCode: {
    type: String, // Base64 du QR code
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastScanned: {
    type: Date,
  },
  scanCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("NFCCard", nfcCardSchema);
