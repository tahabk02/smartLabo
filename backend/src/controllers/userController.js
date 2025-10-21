// userController.js - Fix pour le toggle status

// ❌ AVANT (probablement comme ça)
exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id; // ou req.body.id

    const user = await User.findById(userId);
    // ...
  } catch (error) {
    console.error("Error toggling user status:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ APRÈS (avec validation)
const mongoose = require("mongoose");

exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validation 1: Vérifier que l'ID existe
    if (!userId || userId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Validation 2: Vérifier que c'est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Trouver l'utilisateur
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Empêcher de désactiver son propre compte
    if (user._id.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Toggle le status
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while toggling user status",
    });
  }
};

// Route correspondante (userRoutes.js)
router.patch(
  "/users/:id/toggle-status",
  authMiddleware,
  roleMiddleware(["admin"]),
  toggleUserStatus
);

// Ou si l'ID vient du body:
router.patch(
  "/users/toggle-status",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId || userId === "undefined") {
        return res.status(400).json({
          success: false,
          message: "User ID is required in request body",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user._id.toString() === req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You cannot deactivate your own account",
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.status(200).json({
        success: true,
        message: `User ${
          user.isActive ? "activated" : "deactivated"
        } successfully`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Error toggling user status:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while toggling user status",
      });
    }
  }
);
