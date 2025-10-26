// scripts/resetPassword.js
// Exécuter depuis le dossier backend: node scripts/resetPassword.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ====== CONFIGURATION ======
// ⚠️ Utilisez votre vraie URI MongoDB Atlas depuis .env
require("dotenv").config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/smartlab";
const EMAIL = "tbk@gmail.com";
const NEW_PASSWORD = "Password123!"; // Changez ce mot de passe
// ===========================

console.log("🔗 Using MongoDB URI:", MONGO_URI.replace(/:[^:@]+@/, ":****@")); // Masque le mot de passe

async function resetPassword() {
  try {
    console.log("🔄 Connecting to database...");

    // Connexion à MongoDB
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to database\n");

    // Définir le schéma User inline
    const userSchema = new mongoose.Schema(
      {
        name: String,
        email: String,
        password: String,
        role: String,
        phone: String,
        address: String,
        isActive: Boolean,
      },
      { timestamps: true }
    );

    // Créer ou récupérer le modèle
    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Chercher l'utilisateur
    console.log("🔍 Looking for user:", EMAIL);
    const user = await User.findOne({ email: EMAIL });

    if (!user) {
      console.log("❌ User not found:", EMAIL);
      console.log("\n📋 Available users:");
      const allUsers = await User.find({}, "email name role");
      allUsers.forEach((u) => {
        console.log(`   - ${u.email} (${u.name}) [${u.role}]`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log("✅ User found!");
    console.log("   📧 Email:", user.email);
    console.log("   👤 Name:", user.name);
    console.log("   🎭 Role:", user.role);
    console.log("   ✓ Active:", user.isActive);
    console.log("");

    // Hasher le nouveau mot de passe
    console.log("🔐 Hashing new password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

    // Mettre à jour le mot de passe
    console.log("💾 Updating password in database...");
    user.password = hashedPassword;
    await user.save();

    console.log("\n✅ ========================================");
    console.log("✅ PASSWORD SUCCESSFULLY RESET!");
    console.log("✅ ========================================");
    console.log("");
    console.log("📧 Email:   ", EMAIL);
    console.log("🔑 Password:", NEW_PASSWORD);
    console.log("");
    console.log("⚠️  SAVE THESE CREDENTIALS SECURELY!");
    console.log("");

    // Fermer la connexion
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le script
resetPassword();
