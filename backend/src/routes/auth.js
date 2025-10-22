// backend/routes/auth.routes.js - Updated to support Patient Portal

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const { protect } = require("../middleware/authMiddleware");

// ========== UNIVERSAL REGISTER (Auto-detect role) ==========
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      firstName,
      lastName,
      birthDate,
      gender,
      cin,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // Check if email exists in User or Patient
    const existingUser = await User.findOne({ email });
    const existingPatient = await Patient.findOne({ email });

    if (existingUser || existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✨ Si role = patient OU si on a firstName/lastName → créer Patient
    if (role === "patient" || (firstName && lastName)) {
      const patient = new Patient({
        firstName: firstName || name?.split(" ")[0] || "Patient",
        lastName: lastName || name?.split(" ")[1] || "",
        email,
        password: hashedPassword,
        phone,
        address: address ? { street: address } : undefined,
        birthDate,
        gender,
        cin,
        isActive: true,
      });

      await patient.save();

      const token = jwt.sign(
        { id: patient._id, role: "patient" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: patient._id,
          numeroPatient: patient.numeroPatient,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          role: "patient",
          hasNFCCard: patient.nfc.status === "active",
        },
      });
    }

    // Sinon créer User normal (admin, doctor, etc.)
    const user = new User({
      name: name || `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: role || "patient",
      phone,
      address,
      isActive: true,
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Erreur inscription:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur: " + error.message,
    });
  }
});

// ========== UNIVERSAL LOGIN (Check both User & Patient) ==========
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // ✨ Try to find in Patient collection first
    let patient = await Patient.findOne({ email }).select("+password");

    if (patient) {
      if (!patient.isActive) {
        return res.status(403).json({
          success: false,
          message: "Votre compte est désactivé",
        });
      }

      const isMatch = await patient.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Email ou mot de passe incorrect",
        });
      }

      // Update last login
      patient.lastLogin = new Date();
      await patient.save();

      const token = jwt.sign(
        { id: patient._id, role: "patient" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      console.log("✅ Patient login:", patient.email);

      return res.json({
        success: true,
        token,
        user: {
          id: patient._id,
          numeroPatient: patient.numeroPatient,
          firstName: patient.firstName,
          lastName: patient.lastName,
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          role: "patient",
          hasNFCCard: patient.nfc.status === "active",
          age: patient.age,
        },
      });
    }

    // If not found in Patient, try User collection
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Votre compte est désactivé",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log("✅ User login:", user.email);

    res.json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("❌ Erreur login:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// ========== GET CURRENT USER (Support both User & Patient) ==========
router.get("/me", protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    // ✨ Try Patient first
    let patient = await Patient.findById(req.user._id).select("-password");

    if (patient) {
      if (!patient.isActive) {
        return res.status(403).json({
          success: false,
          message: "Compte désactivé",
        });
      }

      console.log("✅ Patient profile loaded:", patient.email);

      return res.json({
        success: true,
        id: patient._id,
        numeroPatient: patient.numeroPatient,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        role: "patient",
        age: patient.age,
        bloodType: patient.medicalInfo?.bloodType,
        hasNFCCard: patient.nfc.status === "active",
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        preferences: patient.preferences,
        isActive: patient.isActive,
      });
    }

    // If not Patient, get User
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    console.log("✅ User profile loaded:", user.email);

    res.json({
      success: true,
      ...user.toObject(),
    });
  } catch (error) {
    console.error("⚠️ Erreur /me:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
    });
  }
});

// ========== PATIENT-SPECIFIC REGISTER (Optional dedicated endpoint) ==========
router.post("/register/patient", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      birthDate,
      gender,
      cin,
      address,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !birthDate ||
      !gender
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // Check existing
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // Create patient
    const patient = new Patient({
      firstName,
      lastName,
      email,
      password, // Will be hashed by pre-save middleware
      phone,
      birthDate,
      gender,
      cin,
      address: address ? { street: address } : undefined,
      isActive: true,
    });

    await patient.save();

    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Nouveau patient inscrit:", patient.email);

    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token,
      user: {
        id: patient._id,
        numeroPatient: patient.numeroPatient,
        firstName: patient.firstName,
        lastName: patient.lastName,
        fullName: patient.fullName,
        email: patient.email,
        role: "patient",
      },
    });
  } catch (error) {
    console.error("❌ Erreur inscription patient:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur: " + error.message,
    });
  }
});

// ========== LOGOUT ==========
router.post("/logout", protect, async (req, res) => {
  try {
    console.log("👋 Logout:", req.user.email);
    res.json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    console.error("Erreur logout:", error.message);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

// ========== CHECK EMAIL AVAILABILITY ==========
router.post("/check-email", async (req, res) => {
  try {
    const { email } = req.body;

    const userExists = await User.findOne({ email });
    const patientExists = await Patient.findOne({ email });

    res.json({
      success: true,
      available: !userExists && !patientExists,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
});

module.exports = router;
