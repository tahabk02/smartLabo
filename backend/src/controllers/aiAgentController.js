const AnalysisInterpretation = require("../models/AnalysisInterpretation");
const Analysis = require("../models/Analysis");
const Patient = require("../models/Patient");
const pdfService = require("../services/pdfService");
const openaiService = require("../services/openaiService");
const PDFParser = require("../utils/pdfParser");
const TextAnalyzer = require("../utils/textAnalyzer");
const fs = require("fs").promises;
const path = require("path");

/**
 * Upload and interpret medical analysis PDF
 */
exports.uploadAndInterpret = async (req, res) => {
  try {
    const { patientId, analysisId, notes } = req.body;
    const file = req.file;

    // Validation
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    if (!patientId || !analysisId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and Analysis ID are required",
      });
    }

    // Validate PDF file
    if (!PDFParser.isValidPDF(file.path)) {
      await fs.unlink(file.path); // Clean up invalid file
      return res.status(400).json({
        success: false,
        message: "Invalid PDF file",
      });
    }

    // Verify patient and analysis exist
    const [patient, analysis] = await Promise.all([
      Patient.findById(patientId),
      Analysis.findById(analysisId),
    ]);

    if (!patient) {
      await fs.unlink(file.path);
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!analysis) {
      await fs.unlink(file.path);
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    // Create interpretation record
    const interpretation = new AnalysisInterpretation({
      analysisId,
      patientId,
      originalFile: {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
      },
      status: "processing",
      processedBy: req.user.id,
      notes,
      metadata: {
        uploadedAt: new Date(),
        ipAddress: req.ip,
      },
    });

    await interpretation.save();

    // Process asynchronously (non-blocking)
    processInterpretation(
      interpretation._id,
      file.path,
      patient,
      analysis
    ).catch((error) => {
      console.error(
        `❌ Background processing failed for ${interpretation._id}:`,
        error
      );
    });

    res.status(202).json({
      success: true,
      message: "Analysis uploaded successfully and being processed",
      data: {
        interpretationId: interpretation._id,
        status: "processing",
        estimatedTime: "2-3 minutes",
      },
    });
  } catch (error) {
    console.error("❌ Upload Error:", error);

    // Clean up file if upload failed
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to delete file:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload analysis",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Process interpretation asynchronously
 */
async function processInterpretation(
  interpretationId,
  filePath,
  patient,
  analysis
) {
  const startTime = Date.now();

  try {
    console.log(`🔄 Processing interpretation ${interpretationId}...`);

    const interpretation = await AnalysisInterpretation.findById(
      interpretationId
    );

    if (!interpretation) {
      throw new Error("Interpretation not found");
    }

    // Step 1: Extract PDF metadata
    interpretation.status = "extracting";
    await interpretation.save();

    const pdfMetadata = await PDFParser.getMetadata(filePath);
    interpretation.metadata = {
      ...interpretation.metadata,
      pdfPages: pdfMetadata?.pages,
      pdfVersion: pdfMetadata?.version,
    };
    await interpretation.save();

    // Step 2: Extract text from PDF using multiple methods
    let extractedText = "";
    let structuredData = {};

    try {
      // Try custom PDF parser first (better for medical PDFs)
      const medicalData = await PDFParser.extractMedicalData(filePath);

      if (medicalData.success) {
        extractedText = medicalData.rawText;
        structuredData = {
          patientInfo: medicalData.patientInfo,
          testResults: medicalData.testResults,
          dates: medicalData.dates,
          labInfo: medicalData.labInfo,
        };
      }
    } catch (error) {
      console.warn("Custom PDF parser failed, using fallback:", error.message);
    }

    // Fallback to pdfService if custom parser fails
    if (!extractedText) {
      const { text } = await pdfService.extractTextFromPDF(filePath);
      extractedText = text;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new Error("Unable to extract meaningful text from PDF");
    }

    // Step 3: Clean and analyze text
    interpretation.status = "analyzing";
    await interpretation.save();

    const cleanedText = await pdfService.cleanAnalysisText(extractedText);

    // Analyze text quality and complexity
    const textAnalysis = TextAnalyzer.analyze(cleanedText);

    interpretation.extractedText = cleanedText;
    interpretation.structuredData = structuredData;
    interpretation.textAnalysis = {
      wordCount: textAnalysis.wordCount,
      complexity: textAnalysis.complexity,
      readingTime: textAnalysis.readingTime,
      keywords: textAnalysis.keywords,
    };
    await interpretation.save();

    // Step 4: AI Interpretation
    interpretation.status = "interpreting";
    await interpretation.save();

    const patientContext = {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      medicalHistory: patient.medicalHistory,
    };

    const analysisContext = {
      type: analysis.type,
      name: analysis.name,
      category: analysis.category,
    };

    // Get AI interpretation with retry logic
    let aiInterpretation;
    let retries = 3;

    while (retries > 0) {
      try {
        aiInterpretation = await openaiService.interpretAnalysisResults(
          cleanedText,
          patientContext,
          analysisContext,
          structuredData
        );
        break;
      } catch (aiError) {
        retries--;
        if (retries === 0) throw aiError;
        console.warn(`AI interpretation failed, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
      }
    }

    // Step 5: Extract key findings and recommendations
    const keyFindings = extractKeyFindings(aiInterpretation, structuredData);
    const riskLevel = assessRiskLevel(structuredData.testResults);

    // Step 6: Finalize interpretation
    interpretation.interpretation = aiInterpretation;
    interpretation.keyFindings = keyFindings;
    interpretation.riskLevel = riskLevel;
    interpretation.status = "completed";
    interpretation.processingTime = Date.now() - startTime;
    interpretation.completedAt = new Date();

    await interpretation.save();

    // Update analysis record
    await Analysis.findByIdAndUpdate(analysis._id, {
      $set: {
        lastInterpretation: interpretation._id,
        lastInterpretationDate: new Date(),
      },
    });

    console.log(
      `✅ Interpretation completed for ${interpretationId} in ${interpretation.processingTime}ms`
    );

    // Optional: Send notification to user
    // await notificationService.sendInterpretationComplete(interpretation);
  } catch (error) {
    console.error(`❌ Processing Error for ${interpretationId}:`, error);

    try {
      const interpretation = await AnalysisInterpretation.findById(
        interpretationId
      );

      if (interpretation) {
        interpretation.status = "failed";
        interpretation.error = {
          message: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
          timestamp: new Date(),
        };
        interpretation.processingTime = Date.now() - startTime;
        await interpretation.save();
      }
    } catch (updateError) {
      console.error("Failed to update interpretation status:", updateError);
    }
  }
}

/**
 * Extract key findings from AI interpretation
 */
function extractKeyFindings(aiInterpretation, structuredData) {
  const findings = [];

  // Extract abnormal results
  if (structuredData.testResults) {
    structuredData.testResults.forEach((test) => {
      if (test.range && isAbnormal(test.value, test.range)) {
        findings.push({
          type: "abnormal",
          test: test.test,
          value: test.value,
          unit: test.unit,
          expectedRange: test.range,
        });
      }
    });
  }

  // Extract critical keywords from AI interpretation
  const criticalKeywords = ["urgent", "anormal", "critique", "élevé", "faible"];
  const interpretationText =
    typeof aiInterpretation === "string"
      ? aiInterpretation
      : JSON.stringify(aiInterpretation);

  criticalKeywords.forEach((keyword) => {
    if (interpretationText.toLowerCase().includes(keyword)) {
      findings.push({
        type: "alert",
        keyword: keyword,
        context: extractContext(interpretationText, keyword),
      });
    }
  });

  return findings;
}

/**
 * Check if a test value is abnormal
 */
function isAbnormal(value, range) {
  if (!range || typeof value !== "number") return false;

  // Parse range formats like "70-110", "<5", ">100"
  const rangeMatch = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return value < min || value > max;
  }

  return false;
}

/**
 * Extract context around a keyword
 */
function extractContext(text, keyword, contextLength = 100) {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + keyword.length + contextLength);

  return text.substring(start, end).trim();
}

/**
 * Assess overall risk level based on test results
 */
function assessRiskLevel(testResults) {
  if (!testResults || testResults.length === 0) return "unknown";

  let abnormalCount = 0;

  testResults.forEach((test) => {
    if (test.range && isAbnormal(test.value, test.range)) {
      abnormalCount++;
    }
  });

  const abnormalPercentage = (abnormalCount / testResults.length) * 100;

  if (abnormalPercentage === 0) return "normal";
  if (abnormalPercentage < 25) return "low";
  if (abnormalPercentage < 50) return "medium";
  return "high";
}

/**
 * Get single interpretation by ID
 */
exports.getInterpretation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interpretation ID",
      });
    }

    const interpretation = await AnalysisInterpretation.findById(id)
      .populate("patientId", "name email age gender medicalHistory")
      .populate("analysisId", "name type category description")
      .populate("processedBy", "name email role")
      .lean();

    if (!interpretation) {
      return res.status(404).json({
        success: false,
        message: "Interpretation not found",
      });
    }

    // Add download URL for PDF
    if (interpretation.originalFile?.path) {
      interpretation.downloadUrl = `/api/interpretations/${id}/download`;
    }

    res.status(200).json({
      success: true,
      data: interpretation,
    });
  } catch (error) {
    console.error("❌ Get Interpretation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interpretation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Get all interpretations with filtering and pagination
 */
exports.getAllInterpretations = async (req, res) => {
  try {
    const {
      patientId,
      analysisId,
      status,
      riskLevel,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (patientId) query.patientId = patientId;
    if (analysisId) query.analysisId = analysisId;
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [interpretations, total] = await Promise.all([
      AnalysisInterpretation.find(query)
        .populate("patientId", "name email age gender")
        .populate("analysisId", "name type category")
        .populate("processedBy", "name email")
        .sort(sort)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean(),
      AnalysisInterpretation.countDocuments(query),
    ]);

    // Add download URLs
    interpretations.forEach((interpretation) => {
      if (interpretation.originalFile?.path) {
        interpretation.downloadUrl = `/api/interpretations/${interpretation._id}/download`;
      }
    });

    res.status(200).json({
      success: true,
      data: interpretations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("❌ Get Interpretations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch interpretations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Download original PDF file
 */
exports.downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;

    const interpretation = await AnalysisInterpretation.findById(id);

    if (!interpretation) {
      return res.status(404).json({
        success: false,
        message: "Interpretation not found",
      });
    }

    const filePath = interpretation.originalFile.path;

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    // Set headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${
        interpretation.originalFile.originalName ||
        interpretation.originalFile.filename
      }"`
    );

    // Stream file
    const fileStream = require("fs").createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("❌ Download PDF Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download PDF",
    });
  }
};

/**
 * Delete interpretation
 */
exports.deleteInterpretation = async (req, res) => {
  try {
    const { id } = req.params;

    const interpretation = await AnalysisInterpretation.findById(id);

    if (!interpretation) {
      return res.status(404).json({
        success: false,
        message: "Interpretation not found",
      });
    }

    // Delete physical file
    if (interpretation.originalFile?.path) {
      try {
        await fs.unlink(interpretation.originalFile.path);
      } catch (error) {
        console.warn("Failed to delete physical file:", error);
      }
    }

    // Delete database record
    await AnalysisInterpretation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Interpretation deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Interpretation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete interpretation",
    });
  }
};

/**
 * Retry failed interpretation
 */
exports.retryInterpretation = async (req, res) => {
  try {
    const { id } = req.params;

    const interpretation = await AnalysisInterpretation.findById(id)
      .populate("patientId")
      .populate("analysisId");

    if (!interpretation) {
      return res.status(404).json({
        success: false,
        message: "Interpretation not found",
      });
    }

    if (interpretation.status !== "failed") {
      return res.status(400).json({
        success: false,
        message: "Only failed interpretations can be retried",
      });
    }

    // Reset status
    interpretation.status = "processing";
    interpretation.error = undefined;
    await interpretation.save();

    // Retry processing
    processInterpretation(
      interpretation._id,
      interpretation.originalFile.path,
      interpretation.patientId,
      interpretation.analysisId
    ).catch((error) => {
      console.error(`❌ Retry failed for ${interpretation._id}:`, error);
    });

    res.status(200).json({
      success: true,
      message: "Interpretation retry started",
      data: {
        interpretationId: interpretation._id,
        status: "processing",
      },
    });
  } catch (error) {
    console.error("❌ Retry Interpretation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retry interpretation",
    });
  }
};

/**
 * Get interpretation statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    const stats = await AnalysisInterpretation.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const riskStats = await AnalysisInterpretation.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$riskLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    const avgProcessingTime = await AnalysisInterpretation.aggregate([
      {
        $match: { status: "completed", processingTime: { $exists: true } },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$processingTime" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byRiskLevel: riskStats,
        averageProcessingTime: avgProcessingTime[0]?.avgTime || 0,
      },
    });
  } catch (error) {
    console.error("❌ Get Statistics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};
