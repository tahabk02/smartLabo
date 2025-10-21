// src/fixAdminPassword.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // Make sure path correct

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🌍 MongoDB connected"))
  .catch((err) => console.error(err));

async function hashAdminPassword() {
  try {
    const admin = await User.findOne({ email: "admin@lab.com" });
    if (!admin) {
      console.log("Admin not found");
      return process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash("admin123", salt);
    await admin.save();

    console.log("✅ Admin password hashed successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

hashAdminPassword();
