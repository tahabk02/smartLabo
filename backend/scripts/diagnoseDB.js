// backend/scripts/diagnoseDB.js
// Script pour diagnostiquer les problèmes de factures

const mongoose = require("mongoose");
require("dotenv").config();

// Connexion MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartlabo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => {
    console.error("❌ Erreur MongoDB:", err);
    process.exit(1);
  });

const diagnose = async () => {
  try {
    console.log("\n🔍 DIAGNOSTIC DE LA BASE DE DONNÉES\n");
    console.log("=".repeat(60));

    // Charger les modèles
    const User = require("../src/models/User");
    const Patient = require("../src/models/Patient");
    const Facture = require("../src/models/Facture");

    // 1. Vérifier les utilisateurs
    console.log("\n👥 UTILISATEURS:");
    const users = await User.find().select("_id name email role").lean();
    console.log(`   Total: ${users.length}`);

    if (users.length > 0) {
      console.log("\n   Détails:");
      users.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.name || "Sans nom"} (${user.email})`
        );
        console.log(`      Role: ${user.role}`);
        console.log(`      ID: ${user._id}`);
      });
    } else {
      console.log("   ⚠️  Aucun utilisateur trouvé");
    }

    // 2. Vérifier les patients
    console.log("\n\n🏥 PATIENTS:");
    const patients = await Patient.find()
      .select("_id nom prenom numeroPatient userId")
      .lean();
    console.log(`   Total: ${patients.length}`);

    if (patients.length > 0) {
      console.log("\n   Détails:");
      patients.forEach((patient, index) => {
        console.log(
          `   ${index + 1}. ${patient.nom} ${patient.prenom} (${
            patient.numeroPatient
          })`
        );
        console.log(`      ID Patient: ${patient._id}`);
        console.log(`      ID User lié: ${patient.userId || "NON LIÉ"}`);
      });
    } else {
      console.log("   ⚠️  Aucun patient trouvé");
    }

    // 3. Vérifier les factures
    console.log("\n\n💰 FACTURES:");
    const factures = await Facture.find()
      .select("_id numeroFacture patientId montantTotal statut dateEmission")
      .lean();
    console.log(`   Total: ${factures.length}`);

    if (factures.length > 0) {
      console.log("\n   Détails:");
      factures.forEach((facture, index) => {
        console.log(
          `   ${index + 1}. ${facture.numeroFacture || "Sans numéro"}`
        );
        console.log(`      ID Facture: ${facture._id}`);
        console.log(`      Patient ID: ${facture.patientId}`);
        console.log(`      Montant: ${facture.montantTotal || 0} MAD`);
        console.log(`      Statut: ${facture.statut || "N/A"}`);
        console.log(
          `      Date: ${
            facture.dateEmission
              ? new Date(facture.dateEmission).toLocaleDateString()
              : "N/A"
          }`
        );
      });
    } else {
      console.log("   ⚠️  Aucune facture trouvée");
    }

    // 4. Vérifier les correspondances
    console.log("\n\n🔗 VÉRIFICATION DES LIENS:");

    for (const patient of patients) {
      const facturesPatient = factures.filter(
        (f) => f.patientId && f.patientId.toString() === patient._id.toString()
      );

      console.log(`\n   Patient: ${patient.nom} ${patient.prenom}`);
      console.log(`      ID Patient: ${patient._id}`);
      console.log(`      ID User: ${patient.userId || "NON LIÉ ⚠️"}`);
      console.log(`      Factures liées: ${facturesPatient.length}`);

      if (facturesPatient.length > 0) {
        facturesPatient.forEach((f) => {
          console.log(
            `         - ${f.numeroFacture}: ${f.montantTotal} MAD (${f.statut})`
          );
        });
      }
    }

    // 5. Problèmes détectés
    console.log("\n\n🚨 PROBLÈMES DÉTECTÉS:");
    let problemsFound = false;

    // Patients sans userId
    const patientsSansUser = patients.filter((p) => !p.userId);
    if (patientsSansUser.length > 0) {
      problemsFound = true;
      console.log(`\n   ❌ ${patientsSansUser.length} patient(s) sans userId:`);
      patientsSansUser.forEach((p) => {
        console.log(`      - ${p.nom} ${p.prenom} (${p._id})`);
      });
      console.log("      Solution: Lier ces patients à des utilisateurs");
    }

    // Factures sans patient valide
    const facturesSansPatient = factures.filter(
      (f) => !patients.some((p) => p._id.toString() === f.patientId?.toString())
    );
    if (facturesSansPatient.length > 0) {
      problemsFound = true;
      console.log(
        `\n   ❌ ${facturesSansPatient.length} facture(s) avec patientId invalide:`
      );
      facturesSansPatient.forEach((f) => {
        console.log(`      - ${f.numeroFacture}: patientId=${f.patientId}`);
      });
      console.log(
        "      Solution: Corriger les patientId ou supprimer ces factures"
      );
    }

    // Utilisateurs sans patient
    const usersSansPatient = users.filter(
      (u) =>
        u.role === "patient" &&
        !patients.some((p) => p.userId?.toString() === u._id.toString())
    );
    if (usersSansPatient.length > 0) {
      problemsFound = true;
      console.log(
        `\n   ⚠️  ${usersSansPatient.length} utilisateur(s) "patient" sans fiche patient:`
      );
      usersSansPatient.forEach((u) => {
        console.log(`      - ${u.name} (${u.email})`);
      });
      console.log(
        "      Solution: Créer des fiches patients pour ces utilisateurs"
      );
    }

    if (!problemsFound) {
      console.log("   ✅ Aucun problème majeur détecté");
    }

    // 6. Recommandations
    console.log("\n\n💡 RECOMMANDATIONS:");

    if (factures.length === 0) {
      console.log("   1. Créer des factures de test avec:");
      console.log("      node scripts/seedInvoices.js");
    }

    if (patientsSansUser.length > 0) {
      console.log(
        "   2. Lier les patients aux utilisateurs dans la base de données"
      );
    }

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Connexion MongoDB fermée\n");
    process.exit(0);
  }
};

diagnose();
