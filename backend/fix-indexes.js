const mongoose = require("mongoose");
require("dotenv").config();

async function fixIndexes() {
  try {
    console.log("🔧 Connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connecté à MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("conversations");

    console.log("\n📋 Index actuels:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    try {
      console.log("\n🗑️ Suppression de l'index sessionId_1...");
      await collection.dropIndex("sessionId_1");
      console.log("✅ Index sessionId_1 supprimé avec succès");
    } catch (error) {
      if (error.code === 27) {
        console.log("ℹ️ Index sessionId_1 n'existe pas");
      } else {
        console.error("❌ Erreur:", error.message);
      }
    }

    console.log("\n📋 Index après nettoyage:");
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index) => {
      console.log(`  - ${index.name}:`, index.key);
    });

    await mongoose.connection.close();
    console.log("\n✅ Terminé");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

fixIndexes();
