const User = require("../models/User");
const bcrypt = require("bcryptjs");

const createAdmin = async () => {
  try {
    // Check if admin exists
    const adminExists = await User.findOne({ email: "admin@smartlab.com" });

    if (adminExists) {
      console.log("⚠️  Admin already exists");
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Create admin
    const admin = new User({
      name: "Admin SmartLab",
      email: "admin@smartlab.com",
      password: hashedPassword,
      role: "admin",
      phone: "+212 600000000",
      address: "Casablanca, Morocco",
      isActive: true,
    });

    await admin.save();
    console.log("✅ Admin created successfully!");
    console.log("📧 Email: admin@smartlab.com");
    console.log("🔑 Password: admin123");
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

module.exports = createAdmin;
