require("dotenv").config();
const mongoose = require("mongoose");

// ==========================================
// OLD SCHEMA (Collection: analyses)
// ==========================================
const oldAnalysisSchema = new mongoose.Schema({
  patientId: mongoose.Schema.Types.ObjectId,
  analyseType: String,
  fileUrl: String,
  resultOCR: String,
  status: String,
  aiResult: Object,
  prix: Number,
  createdAt: Date,
  isActive: Boolean,
  updatedAt: Date,
  category: String,
  description: String,
  name: String,
  normalRange: String,
  price: Number,
  turnaroundTime: String,
});

const OldAnalysis = mongoose.model(
  "OldAnalysis",
  oldAnalysisSchema,
  "analyses"
);

// ==========================================
// NEW SCHEMA (Collection: patientanalyses)
// ==========================================
const PatientAnalysis = require("./models/PatientAnalysis");
const Analysis = require("./models/Analysis");

// ==========================================
// MIGRATION FUNCTION
// ==========================================
async function migrateAnalyses() {
  try {
    console.log("🚀 Starting migration...");

    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch old analyses
    const oldAnalyses = await OldAnalysis.find();
    console.log(`📊 Found ${oldAnalyses.length} old analyses to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const oldAnalysis of oldAnalyses) {
      try {
        // Check if already migrated
        const exists = await PatientAnalysis.findOne({
          patient: oldAnalysis.patientId,
          "reportPdf.url": oldAnalysis.fileUrl,
        });

        if (exists) {
          console.log(
            `⏭️  Skipping: Already migrated (${oldAnalysis.analyseType})`
          );
          skippedCount++;
          continue;
        }

        // Find or create analysis type
        let analysisType = await Analysis.findOne({
          name: oldAnalysis.analyseType,
        });

        if (!analysisType) {
          analysisType = await Analysis.create({
            name: oldAnalysis.analyseType || oldAnalysis.name || "Unknown",
            code: `ANA${Date.now()}`,
            category: oldAnalysis.category || "Biochemistry",
            price: oldAnalysis.prix || oldAnalysis.price || 0,
            description: oldAnalysis.description || "",
            normalRange: oldAnalysis.normalRange || "",
            turnaroundTime: oldAnalysis.turnaroundTime || "24 hours",
            isActive: true,
          });
          console.log(`📝 Created analysis type: ${analysisType.name}`);
        }

        // Parse results from OCR
        const results = [];
        if (oldAnalysis.resultOCR) {
          const parts = oldAnalysis.resultOCR.split(":");
          if (parts.length === 2) {
            results.push({
              parameter: parts[0].trim(),
              value: parts[1].trim(),
              unit: "",
              isAbnormal: false,
              severity: "normal",
            });
          }
        }

        // Create new patient analysis
        const newAnalysis = await PatientAnalysis.create({
          patient: oldAnalysis.patientId,
          analysisType: analysisType._id,
          requestDate: oldAnalysis.createdAt || new Date(),
          resultDate: oldAnalysis.updatedAt || new Date(),
          status: mapOldStatus(oldAnalysis.status),
          results: results,
          interpretation: oldAnalysis.aiResult?.interpretation || "",
          conclusion: oldAnalysis.aiResult?.conclusion || "",
          recommendations: oldAnalysis.aiResult?.recommendations || "",
          reportPdf: {
            url: oldAnalysis.fileUrl,
            filename: oldAnalysis.fileUrl?.split("/").pop() || "",
          },
          price: oldAnalysis.prix || oldAnalysis.price || 0,
          paid: oldAnalysis.status === "traité",
        });

        console.log(
          `✅ Migrated: ${oldAnalysis.analyseType} (${newAnalysis.analysisNumber})`
        );
        migratedCount++;
      } catch (error) {
        console.error(`❌ Error migrating analysis:`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION SUMMARY");
    console.log("=".repeat(50));
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total: ${oldAnalyses.length}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// ==========================================
// HELPER: Map old status to new status
// ==========================================
function mapOldStatus(oldStatus) {
  const statusMap = {
    traité: "completed",
    "en cours": "in_progress",
    "en attente": "pending",
    validé: "validated",
    livré: "delivered",
  };
  return statusMap[oldStatus] || "completed";
}

// ==========================================
// RUN MIGRATION
// ==========================================
migrateAnalyses();
