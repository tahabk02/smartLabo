// scripts/checkBackend.js
// Exécuter: node scripts/checkBackend.js

const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/smartlab";

async function checkBackend() {
  try {
    console.log("🔍 Checking backend configuration...\n");

    // 1. Vérifier la connexion MongoDB
    console.log("📊 Testing MongoDB connection...");
    console.log("   URI:", MONGO_URI);

    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected successfully!\n");

    // 2. Lister toutes les collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("📚 Available collections:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });
    console.log("");

    // 3. Compter les documents dans users
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User =
      mongoose.models.User || mongoose.model("User", userSchema, "users");

    const userCount = await User.countDocuments();
    console.log("👥 Users in database:", userCount);

    if (userCount > 0) {
      console.log("\n📋 List of users:");
      const users = await User.find({}, "email name role isActive createdAt");
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Name: ${user.name}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Active: ${user.isActive}`);
        console.log(`      Created: ${user.createdAt || "N/A"}`);
        console.log("");
      });
    }

    // 4. Vérifier la variable d'environnement
    console.log("🔐 Environment variables:");
    console.log(
      "   JWT_SECRET:",
      process.env.JWT_SECRET ? "SET ✅" : "MISSING ❌"
    );
    console.log(
      "   MONGO_URI:",
      process.env.MONGO_URI ? "SET ✅" : "MISSING ❌"
    );
    console.log("   PORT:", process.env.PORT || "Not set (default: 5000)");
    console.log("");

    await mongoose.connection.close();
    console.log("✅ Check completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("\n💡 Possible solutions:");
    console.error("   1. Make sure MongoDB is running");
    console.error("   2. Check the database name in MONGO_URI");
    console.error("   3. Verify your .env file configuration");
    process.exit(1);
  }
}

checkBackend();
