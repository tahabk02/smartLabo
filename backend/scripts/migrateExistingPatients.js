// backend/scripts/migrateExistingPatients.js
const mongoose = require("mongoose");
const User = require("../src/models/User");
require("dotenv").config();

const migrateExistingPatients = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Trouver tous les utilisateurs avec rôle "patient"
    const patientUsers = await User.find({ role: "patient" });
    console.log(`📋 Found ${patientUsers.length} patient users\n`);

    let created = 0;
    let linked = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of patientUsers) {
      console.log(`\n👤 Processing: ${user.name} (${user.email})`);

      try {
        // Chercher si un patient existe déjà
        const existingPatient = await mongoose.connection
          .collection("patients")
          .findOne({
            $or: [
              { user: user._id },
              { userId: user._id },
              { email: user.email },
            ],
          });

        if (existingPatient) {
          // Si patient existe, juste créer le lien
          if (!existingPatient.user) {
            await mongoose.connection
              .collection("patients")
              .updateOne(
                { _id: existingPatient._id },
                { $set: { user: user._id, userId: user._id } }
              );
            console.log("   ✅ Linked existing patient");
            linked++;
          } else {
            console.log("   ⏭️ Already linked");
            skipped++;
          }
        } else {
          // Créer un nouveau patient en utilisant directement la collection (contourne validation)
          const patientCount = await mongoose.connection
            .collection("patients")
            .countDocuments();
          const numeroPatient = `PAT${String(patientCount + 1).padStart(
            6,
            "0"
          )}`;

          // Extraire prénom et nom
          const nameParts = user.name.trim().split(" ");
          const firstName = nameParts[0] || user.name;
          const lastName =
            nameParts.length > 1 ? nameParts.slice(1).join(" ") : user.name;

          const newPatient = {
            user: user._id,
            userId: user._id,
            numeroPatient: numeroPatient,

            // Champs requis avec valeurs par défaut
            firstName: firstName,
            lastName: lastName,
            nom: lastName,
            prenom: firstName,
            name: user.name,
            email: user.email || `${numeroPatient}@placeholder.com`, // Email obligatoire

            // Autres champs
            telephone: user.phone || "",
            phone: user.phone || "",
            adresse: user.address || "",
            address: user.address || "",

            // Date de naissance obligatoire
            dateNaissance: new Date("2000-01-01"),
            birthDate: new Date("2000-01-01"),

            // Autres infos
            sexe: "Non spécifié",
            gender: "Non spécifié",
            groupeSanguin: "Non spécifié",
            bloodType: "Non spécifié",

            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await mongoose.connection
            .collection("patients")
            .insertOne(newPatient);
          console.log(`   ✅ Created new patient: ${numeroPatient}`);
          created++;
        }
      } catch (itemError) {
        console.error(`   ❌ Error for ${user.email}:`, itemError.message);
        errors++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 MIGRATION SUMMARY:");
    console.log("=".repeat(60));
    console.log(`   ✅ Created new patients: ${created}`);
    console.log(`   🔗 Linked existing patients: ${linked}`);
    console.log(`   ⏭️ Already linked (skipped): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📋 Total processed: ${patientUsers.length}`);
    console.log("=".repeat(60));
    console.log("\n🎉 Migration complete!");
    console.log("🔄 Please restart your backend server.\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
    console.error(error.stack);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

migrateExistingPatients();
