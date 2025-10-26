// backend/scripts/quickDiagnose.js

const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartlabo")
  .then(() => console.log("✅ Connecté"))
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  });

const User = require("../src/models/User");
const Patient = require("../src/models/Patient");

const diagnose = async () => {
  try {
    console.log("\n🔍 DIAGNOSTIC RAPIDE\n" + "=".repeat(60));

    // Trouver tous les users patients
    const users = await User.find({ role: "patient" })
      .select("_id name email")
      .lean();
    console.log(`\n👥 ${users.length} utilisateur(s) patient trouvé(s):`);

    for (const user of users) {
      console.log(`\n   User: ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);

      // Chercher le patient lié
      const patient = await Patient.findOne({ userId: user._id });

      if (patient) {
        console.log(
          `   ✅ Patient lié: ${patient.nom} ${patient.prenom} (${patient._id})`
        );
      } else {
        console.log(`   ❌ AUCUN PATIENT LIÉ !`);
        console.log(`   → Il faut créer un patient pour cet utilisateur`);
      }
    }

    // Compter les patients
    const totalPatients = await Patient.countDocuments();
    const patientsWithUser = await Patient.countDocuments({
      userId: { $exists: true },
    });

    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`   Total patients: ${totalPatients}`);
    console.log(`   Patients avec userId: ${patientsWithUser}`);
    console.log(`   Patients sans userId: ${totalPatients - patientsWithUser}`);

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

diagnose();
