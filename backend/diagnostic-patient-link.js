// backend/diagnostic-patient-link.js
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./src/models/User");
const Patient = require("./src/models/Patient");
const Facture = require("./src/models/Facture");

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté\n");

    const userId = "68fd73f13c0c2339f1809891";
    const factureId = "68fd7791986d97e90918d94b";

    console.log("🔍 ========== DIAGNOSTIC ==========\n");

    console.log("1️⃣ UTILISATEUR:");
    const user = await User.findById(userId);
    if (user) {
      console.log("   ✅ User trouvé: " + user.email + " (" + user.name + ")");
      console.log("   Role: " + user.role);
    } else {
      console.log("   ❌ User non trouvé");
      process.exit(1);
    }

    console.log("\n2️⃣ RECHERCHE PATIENT:");

    const patient1 = await Patient.findOne({ user: userId });
    console.log(
      "   Par { user: userId }:",
      patient1 ? "✅ " + patient1._id : "❌ Aucun"
    );

    const patient2 = await Patient.findOne({ userId: userId });
    console.log(
      "   Par { userId: userId }:",
      patient2 ? "✅ " + patient2._id : "❌ Aucun"
    );

    const patient3 = await Patient.findOne({ email: user.email });
    console.log(
      "   Par { email }:",
      patient3 ? "✅ " + patient3._id : "❌ Aucun"
    );

    const anyPatient = patient1 || patient2 || patient3;
    if (anyPatient) {
      console.log("\n   📋 Structure Patient trouvé:");
      console.log("      _id: " + anyPatient._id);
      console.log("      user: " + anyPatient.user);
      console.log("      userId: " + anyPatient.userId);
      console.log("      nom: " + anyPatient.nom);
      console.log("      prenom: " + anyPatient.prenom);
      console.log("      email: " + anyPatient.email);
    } else {
      console.log("\n   ❌ AUCUN PATIENT TROUVÉ POUR CET USER!");
      console.log("\n   💡 Solution: Créer un document Patient lié à cet User");

      const samplePatient = await Patient.findOne();
      if (samplePatient) {
        console.log("\n   📋 Exemple de Patient existant dans la DB:");
        console.log("      _id: " + samplePatient._id);
        console.log("      user: " + samplePatient.user);
        console.log("      userId: " + samplePatient.userId);
        console.log("      email: " + samplePatient.email);
      }

      process.exit(0);
    }

    console.log("\n3️⃣ FACTURE:");
    const facture = await Facture.findById(factureId);
    if (facture) {
      console.log("   ✅ Facture trouvée: " + facture.numeroFacture);
      console.log("   patientId: " + facture.patientId);
      console.log("   patient: " + facture.patient);

      const facturePatientId = facture.patientId || facture.patient;
      console.log("   → Patient ID de la facture: " + facturePatientId);
    } else {
      console.log("   ❌ Facture non trouvée");
      process.exit(1);
    }

    console.log("\n4️⃣ COMPARAISON:");
    const patientId = anyPatient._id;
    const facturePatientId = facture.patientId || facture.patient;

    console.log("   User ID:           " + userId);
    console.log("   Patient ID:        " + patientId);
    console.log("   Facture.patientId: " + facturePatientId);

    if (patientId.toString() === facturePatientId.toString()) {
      console.log("\n   ✅ MATCH! Le patient correspond à la facture");
      console.log("   → Le code devrait fonctionner maintenant");
    } else {
      console.log("\n   ❌ PAS DE MATCH!");
      console.log("   → Cette facture appartient à un autre patient");

      const realOwner = await Patient.findById(facturePatientId);
      if (realOwner) {
        console.log("\n   👤 Vrai propriétaire de la facture:");
        console.log("      Patient: " + realOwner.nom + " " + realOwner.prenom);
        console.log("      Email: " + realOwner.email);
        console.log("      Patient ID: " + realOwner._id);
        if (realOwner.user || realOwner.userId) {
          console.log("      User ID: " + (realOwner.user || realOwner.userId));
        }
      }
    }

    console.log("\n🔍 ========== FIN DIAGNOSTIC ==========\n");
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
  }
}

diagnose();
