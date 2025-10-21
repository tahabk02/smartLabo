const mongoose = require("mongoose");

const interpretationSchema = new mongoose.Schema(
  {
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    originalFile: {
      filename: String,
      path: String,
      size: Number,
    },
    extractedText: {
      type: String,
    },
    interpretation: {
      summary: String,
      details: String,
      recommendations: [String],
      concerns: [String],
      normalRanges: [
        {
          parameter: String,
          value: String,
          normalRange: String,
          status: { type: String, enum: ["normal", "low", "high", "critical"] },
        },
      ],
    },
    aiModel: {
      type: String,
      default: "gpt-4",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AnalysisInterpretation", interpretationSchema);
