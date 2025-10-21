const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/auth/register
// @desc    Register new user (et créer patient si role = patient)
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      // Champs supplémentaires pour patient
      nom,
      prenom,
      telephone,
      dateNaissance,
      sexe,
      adresse,
    } = req.body;

    // Définir le rôle par défaut si non fourni
    const userRole = role || "patient";

    console.log("📝 Registration attempt:", { email, role: userRole });

    // Validation des champs obligatoires
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe sont requis",
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Cet email est déjà utilisé",
      });
    }

    // Si c'est un patient, vérifier que les infos nécessaires sont fournies
    if (userRole === "patient") {
      if (!nom || !prenom) {
        return res.status(400).json({
          message: "Nom et prénom sont requis pour un patient",
        });
      }
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await User.create({
      name: name || `${prenom} ${nom}`,
      email,
      password: hashedPassword,
      role: userRole,
    });

    console.log("✅ User created:", user._id);

    // Si le rôle est "patient", créer aussi un document Patient
    let patient = null;
    if (userRole === "patient") {
      try {
        // Générer numéro de patient
        const patientCount = await Patient.countDocuments();
        const numeroPatient = `P${new Date().getFullYear()}${String(
          patientCount + 1
        ).padStart(5, "0")}`;

        patient = await Patient.create({
          nom: nom || "",
          prenom: prenom || "",
          name: `${prenom} ${nom}`,
          email,
          telephone: telephone || "",
          dateNaissance: dateNaissance || null,
          sexe: sexe || "Non spécifié",
          adresse: adresse || "",
          numeroPatient,
          user: user._id, // Lien avec le compte utilisateur
        });

        console.log("✅ Patient profile created:", patient._id);

        // Mettre à jour l'utilisateur avec la référence au patient
        user.patientProfile = patient._id;
        await user.save();
      } catch (patientError) {
        console.error("❌ Error creating patient profile:", patientError);
        // Si la création du patient échoue, on continue quand même
        // L'utilisateur peut créer son profil patient plus tard
      }
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Préparer la réponse
    const response = {
      success: true,
      message: "Inscription réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    // Ajouter les infos du patient si créé
    if (patient) {
      response.patient = {
        id: patient._id,
        numeroPatient: patient.numeroPatient,
        nom: patient.nom,
        prenom: patient.prenom,
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe sont requis",
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Générer le token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Si l'utilisateur est un patient, récupérer ses infos patient
    let patientInfo = null;
    if (user.role === "patient" && user.patientProfile) {
      try {
        patientInfo = await Patient.findById(user.patientProfile).select(
          "numeroPatient nom prenom telephone"
        );
      } catch (err) {
        console.log("⚠️ Could not fetch patient info");
      }
    }

    // Préparer la réponse
    const response = {
      success: true,
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    // Ajouter les infos du patient si disponibles
    if (patientInfo) {
      response.patient = {
        id: patientInfo._id,
        numeroPatient: patientInfo.numeroPatient,
        nom: patientInfo.nom,
        prenom: patientInfo.prenom,
      };
    }

    console.log("✅ Login successful:", user.email);
    res.json(response);
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    // Si c'est un patient, inclure ses infos patient
    let patientInfo = null;
    if (user.role === "patient" && user.patientProfile) {
      patientInfo = await Patient.findById(user.patientProfile);
    }

    const response = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    };

    if (patientInfo) {
      response.patient = patientInfo;
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
