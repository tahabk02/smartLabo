// backend/fix-invoice-index.js - VERSION CORRIGÉE

const mongoose = require("mongoose");
require("dotenv").config();

async function fixInvoiceIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté\n");

    const db = mongoose.connection.db;
    const collection = db.collection("factures");

    // 1. Supprimer les anciens index problématiques
    console.log("🔧 Étape 1: Nettoyage des index...");
    try {
      await collection.dropIndex("invoiceNumber_1");
      console.log("   ✅ Index invoiceNumber_1 supprimé");
    } catch (error) {
      console.log("   ⚠️  Index invoiceNumber_1 n'existe pas");
    }

    // 2. Compter les factures avec invoiceNumber null
    const nullInvoices = await collection
      .find({
        $or: [{ invoiceNumber: null }, { invoiceNumber: { $exists: false } }],
      })
      .toArray();

    console.log(`\n📊 Factures à corriger: ${nullInvoices.length}`);

    // 3. Corriger chaque facture individuellement
    if (nullInvoices.length > 0) {
      console.log("\n🔧 Étape 2: Correction des factures...");

      let corrected = 0;
      for (const invoice of nullInvoices) {
        // Générer un numéro unique basé sur le timestamp de l'ObjectId
        const timestamp = invoice._id.getTimestamp().getTime();
        const invoiceNumber = `FAC${String(timestamp).slice(-6)}`;

        try {
          await collection.updateOne(
            { _id: invoice._id },
            { $set: { invoiceNumber: invoiceNumber } }
          );
          corrected++;
          console.log(`   ✅ ${invoice._id} → ${invoiceNumber}`);
        } catch (error) {
          console.log(`   ❌ Erreur pour ${invoice._id}: ${error.message}`);
        }
      }

      console.log(
        `\n✅ ${corrected}/${nullInvoices.length} facture(s) corrigée(s)`
      );
    }

    // 4. Vérifier qu'il n'y a plus de null
    const remainingNull = await collection.countDocuments({
      $or: [{ invoiceNumber: null }, { invoiceNumber: { $exists: false } }],
    });

    console.log(
      `\n📊 Factures avec invoiceNumber null restantes: ${remainingNull}`
    );

    // 5. Créer le nouvel index sur numeroFacture (pas invoiceNumber)
    console.log("\n🔧 Étape 3: Création du nouvel index...");
    try {
      await collection.createIndex(
        { numeroFacture: 1 },
        { unique: true, sparse: true }
      );
      console.log("   ✅ Index numeroFacture_1 créé");
    } catch (error) {
      console.log("   ⚠️  Index numeroFacture existe déjà");
    }

    // 6. Afficher un résumé
    const totalInvoices = await collection.countDocuments();
    const withNumeroFacture = await collection.countDocuments({
      numeroFacture: { $exists: true, $ne: null },
    });
    const withInvoiceNumber = await collection.countDocuments({
      invoiceNumber: { $exists: true, $ne: null },
    });

    console.log("\n📊 RÉSUMÉ:");
    console.log(`   Total factures: ${totalInvoices}`);
    console.log(`   Avec numeroFacture: ${withNumeroFacture}`);
    console.log(`   Avec invoiceNumber: ${withInvoiceNumber}`);

    console.log("\n✅ Correction terminée avec succès!");
  } catch (error) {
    console.error("\n❌ Erreur:", error);
  } finally {
    await mongoose.disconnect();
  }
}

fixInvoiceIndex();
