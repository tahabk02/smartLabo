// fixPasswords.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User"); // adjust path if needed

async function fixPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌍 Connected to MongoDB");

    const users = await User.find();
    console.log(`🔹 Found ${users.length} users`);

    for (const user of users) {
      // Skip already hashed passwords (start with $2b$)
      if (!user.password.startsWith("$2b$")) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(user.password, salt);
        user.password = hashed;
        await user.save();
        console.log(`✅ Password hashed for ${user.email} (${user.role})`);
      }
    }

    console.log("🎯 All passwords fixed!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

fixPasswords();
