const Analysis = require("../models/Analysis");

const seedAnalyses = async () => {
  try {
    const count = await Analysis.countDocuments();

    if (count > 0) {
      console.log("⚠️  Analyses already seeded");
      return;
    }

    const analyses = [
      {
        name: "Complete Blood Count (CBC)",
        code: "CBC001",
        category: "Hematology",
        price: 150,
        description: "Full blood analysis including RBC, WBC, Platelets",
        normalRange: "See detailed report",
        turnaroundTime: "24 hours",
      },
      {
        name: "Blood Glucose",
        code: "GLU001",
        category: "Biochemistry",
        price: 50,
        description: "Fasting blood sugar test",
        normalRange: "70-100 mg/dL",
        turnaroundTime: "2 hours",
      },
      {
        name: "Lipid Profile",
        code: "LIP001",
        category: "Biochemistry",
        price: 200,
        description: "Cholesterol, HDL, LDL, Triglycerides",
        normalRange: "See detailed report",
        turnaroundTime: "24 hours",
      },
      {
        name: "Liver Function Test (LFT)",
        code: "LFT001",
        category: "Biochemistry",
        price: 250,
        description: "Complete liver enzyme panel",
        normalRange: "See detailed report",
        turnaroundTime: "24 hours",
      },
      {
        name: "Kidney Function Test (KFT)",
        code: "KFT001",
        category: "Biochemistry",
        price: 250,
        description: "Urea, Creatinine, Uric Acid",
        normalRange: "See detailed report",
        turnaroundTime: "24 hours",
      },
      {
        name: "Thyroid Profile (T3, T4, TSH)",
        code: "THY001",
        category: "Endocrinology",
        price: 300,
        description: "Complete thyroid hormone panel",
        normalRange: "See detailed report",
        turnaroundTime: "48 hours",
      },
      {
        name: "HbA1c (Glycated Hemoglobin)",
        code: "HBA001",
        category: "Biochemistry",
        price: 180,
        description: "3-month average blood sugar",
        normalRange: "< 5.7%",
        turnaroundTime: "24 hours",
      },
      {
        name: "Urine Analysis",
        code: "URI001",
        category: "Clinical Pathology",
        price: 80,
        description: "Complete urine examination",
        normalRange: "See detailed report",
        turnaroundTime: "6 hours",
      },
      {
        name: "X-Ray Chest",
        code: "XRC001",
        category: "Radiology",
        price: 350,
        description: "Chest X-ray imaging",
        normalRange: "Normal chest anatomy",
        turnaroundTime: "2 hours",
      },
      {
        name: "Vitamin D",
        code: "VIT001",
        category: "Biochemistry",
        price: 400,
        description: "Vitamin D3 level",
        normalRange: "30-100 ng/mL",
        turnaroundTime: "48 hours",
      },
    ];

    await Analysis.insertMany(analyses);
    console.log(`✅ Seeded ${analyses.length} analyses successfully!`);
  } catch (error) {
    console.error("❌ Error seeding analyses:", error.message);
  }
};

module.exports = seedAnalyses;
