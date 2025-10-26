// backend/scripts/checkFactureSchema.js
const mongoose = require("mongoose");
const Facture = require("../src/models/Facture");
const User = require("../src/models/User");
require("dotenv").config({ path: "../.env" });

const checkSchema = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    console.log("🔗 URI:", process.env.MONGODB_URI || "NOT FOUND IN .env");

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/smartlabo"
    );
    console.log("✅ Connected to MongoDB\n");

    // 1. Afficher le schéma Facture
    const schema = Facture.schema;
    console.log("📋 ========== FACTURE SCHEMA STRUCTURE ==========");
    Object.keys(schema.paths).forEach((path) => {
      const pathObj = schema.paths[path];
      const type = pathObj.instance;
      const ref = pathObj.options.ref;
      const required = pathObj.options.required ? "(required)" : "";
      console.log(
        `  ${path.padEnd(20)} : ${type.padEnd(15)} ${
          ref ? `→ ref: ${ref}` : ""
        } ${required}`
      );
    });

    // 2. Compter les factures
    const count = await Facture.countDocuments();
    console.log(`\n📊 ========== DATABASE STATS ==========`);
    console.log(`Total factures: ${count}`);

    // 3. Compter les users
    const userCount = await User.countDocuments();
    console.log(`Total users: ${userCount}`);

    const patientCount = await User.countDocuments({ role: "patient" });
    console.log(`Total patients: ${patientCount}`);

    // 4. Afficher les patients avec leurs IDs
    console.log(`\n👥 ========== PATIENTS IN DATABASE ==========`);
    const patients = await User.find({ role: "patient" })
      .select("_id name email")
      .limit(10)
      .lean();
    patients.forEach((patient, i) => {
      console.log(
        `${i + 1}. ${patient.name.padEnd(30)} | ${patient.email.padEnd(
          30
        )} | ID: ${patient._id}`
      );
    });

    // 5. Afficher quelques factures
    if (count > 0) {
      console.log(
        `\n📄 ========== SAMPLE INVOICES (${Math.min(
          count,
          5
        )} of ${count}) ==========`
      );
      const samples = await Facture.find().limit(5).lean();

      samples.forEach((invoice, i) => {
        console.log(`\n--- Facture ${i + 1} ---`);
        console.log(`  _id:            ${invoice._id}`);
        console.log(`  numeroFacture:  ${invoice.numeroFacture}`);
        console.log(`  patient:        ${invoice.patient || "N/A"}`);
        console.log(`  patientId:      ${invoice.patientId || "N/A"}`);
        console.log(`  montantTotal:   ${invoice.montantTotal || 0} MAD`);
        console.log(
          `  statut:         ${invoice.statut || invoice.status || "N/A"}`
        );
        console.log(
          `  dateFacture:    ${
            invoice.dateFacture
              ? new Date(invoice.dateFacture).toLocaleDateString("fr-FR")
              : "N/A"
          }`
        );
      });

      // 6. Vérifier si les factures ont des patients valides
      console.log(`\n🔍 ========== VALIDATION CHECK ==========`);
      const facturesWithPatient = await Facture.countDocuments({
        patient: { $exists: true, $ne: null },
      });
      const facturesWithPatientId = await Facture.countDocuments({
        patientId: { $exists: true, $ne: null },
      });

      console.log(`Factures avec champ 'patient':   ${facturesWithPatient}`);
      console.log(`Factures avec champ 'patientId': ${facturesWithPatientId}`);

      // 7. Trouver le patient spécifique (tbk@gmail.com)
      console.log(`\n🎯 ========== SPECIFIC USER CHECK ==========`);
      const specificUser = await User.findOne({ email: "tbk@gmail.com" });
      if (specificUser) {
        console.log(`✅ User found: ${specificUser.name}`);
        console.log(`   ID:    ${specificUser._id}`);
        console.log(`   Email: ${specificUser.email}`);
        console.log(`   Role:  ${specificUser.role}`);

        // Chercher ses factures
        const userInvoices1 = await Facture.find({ patient: specificUser._id });
        const userInvoices2 = await Facture.find({
          patientId: specificUser._id,
        });

        console.log(`\n   Factures (champ patient):   ${userInvoices1.length}`);
        console.log(`   Factures (champ patientId): ${userInvoices2.length}`);

        if (userInvoices1.length > 0 || userInvoices2.length > 0) {
          console.log(`\n   ✅ SOLUTION: Use this query in backend:`);
          if (userInvoices1.length > 0) {
            console.log(`      await Facture.find({ patient: userId })`);
          }
          if (userInvoices2.length > 0) {
            console.log(`      await Facture.find({ patientId: userId })`);
          }
        } else {
          console.log(`\n   ⚠️ No invoices found for this user!`);
        }
      } else {
        console.log(`❌ User 'tbk@gmail.com' not found`);
      }
    } else {
      console.log("\n⚠️ No invoices in database yet.");
    }

    console.log("\n✅ Analysis complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

checkSchema();
