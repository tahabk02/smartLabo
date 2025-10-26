// backend/scripts/createTestInvoice.js
const mongoose = require("mongoose");
const Facture = require("../src/models/Facture");
const User = require("../src/models/User");
require("dotenv").config();

const createTestInvoice = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Trouver l'utilisateur patient
    const patient = await User.findOne({ email: "tbk@gmail.com" });

    if (!patient) {
      console.error("❌ Patient not found with email tbk@gmail.com");
      process.exit(1);
    }

    console.log("✅ Found patient:", patient._id);

    // Créer une facture de test
    const testInvoice = new Facture({
      numeroFacture: "TEST-001",
      dateFacture: new Date(),
      patientId: patient._id, // Essayer ce champ
      patient: patient._id, // ET ce champ
      montantTotal: 350.0,
      statut: "En attente",
      items: [
        {
          description: "Analyse de sang complète",
          quantity: 1,
          unitPrice: 250.0,
          total: 250.0,
        },
        {
          description: "Radiographie",
          quantity: 1,
          unitPrice: 100.0,
          total: 100.0,
        },
      ],
      notes: "Facture de test créée automatiquement",
    });

    await testInvoice.save();
    console.log("✅ Test invoice created:", testInvoice._id);
    console.log("📄 Invoice details:", {
      id: testInvoice._id,
      numeroFacture: testInvoice.numeroFacture,
      patientId: testInvoice.patientId,
      patient: testInvoice.patient,
      montantTotal: testInvoice.montantTotal,
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

createTestInvoice();
