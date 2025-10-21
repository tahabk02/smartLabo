const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");

// GET all users (admin only)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create new user (admin only)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      isActive: true,
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT update user by ID (admin only)
router.put("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    const updateData = { name, email, role, phone, address };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH toggle user active status (admin only)
router.patch(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = !user.isActive;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      res.json(userResponse);
    } catch (error) {
      console.error("Error toggling user status:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE user by ID (admin only, cannot delete self)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
