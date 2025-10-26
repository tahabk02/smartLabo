// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const { protect } = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (and create Patient if role is patient)
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    console.log(
      "📝 [REGISTER] New registration attempt:",
      email,
      "Role:",
      role
    );

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Veuillez fournir tous les champs obligatoires",
      });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: "Un utilisateur avec cet email existe déjà",
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "patient",
      phone,
      address,
      isActive: true,
    });

    await user.save();
    console.log("✅ [REGISTER] User created:", user._id);

    // ✅ SI LE RÔLE EST PATIENT : Créer automatiquement un document Patient
    let patient = null;
    if (user.role === "patient") {
      try {
        const patientCount = await Patient.countDocuments();
        const numeroPatient = `PAT${String(patientCount + 1).padStart(6, "0")}`;

        patient = new Patient({
          user: user._id,
          userId: user._id,
          numeroPatient: numeroPatient,
          nom: name.split(" ")[name.split(" ").length - 1] || name,
          prenom: name.split(" ")[0] || name,
          name: name,
          email: email,
          telephone: phone || "",
          phone: phone || "",
          adresse: address || "",
          address: address || "",
          dateNaissance: null,
          birthDate: null,
          sexe: "Non spécifié",
          gender: "Non spécifié",
          groupeSanguin: "Non spécifié",
          bloodType: "Non spécifié",
          isActive: true,
          createdAt: new Date(),
        });

        await patient.save();
        console.log(
          "✅ [REGISTER] Patient profile created:",
          patient._id,
          numeroPatient
        );
      } catch (patientError) {
        console.error(
          "❌ [REGISTER] Error creating patient profile:",
          patientError
        );
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

    // 🔥 CORRECTION : Préparer la réponse user SANS le token
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      isActive: user.isActive,
      // ❌ PAS de token ici !
    };

    // Si patient créé, ajouter ses infos
    if (patient) {
      userResponse.patientInfo = {
        _id: patient._id,
        numeroPatient: patient.numeroPatient,
        nom: patient.nom,
        prenom: patient.prenom,
      };
    }

    console.log("✅ [REGISTER] Registration successful");

    // 🔥 CORRECTION : Token à la racine de la réponse
    res.status(201).json({
      success: true,
      message: "Inscription réussie",
      token: token, // ✅ Token ici à la racine !
      user: userResponse, // ✅ User sans token
    });
  } catch (error) {
    console.error("❌ [REGISTER] Error:", error);
    res.status(500).json({
      message: "Erreur serveur lors de l'inscription",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 [LOGIN] Login attempt:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Veuillez fournir l'email et le mot de passe",
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ [LOGIN] User not found:", email);
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      console.log("❌ [LOGIN] Account disabled:", email);
      return res.status(403).json({
        message: "Votre compte est désactivé. Contactez l'administrateur.",
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ [LOGIN] Invalid password for:", email);
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

    // 🔥 VÉRIFICATION : S'assurer que le token est bien généré
    if (!token) {
      console.error("❌ [LOGIN] Token generation failed for:", email);
      return res.status(500).json({
        message: "Erreur lors de la génération du token",
      });
    }

    console.log("✅ [LOGIN] Token generated for:", email);

    // Si c'est un patient, récupérer ses infos
    let patientInfo = null;
    if (user.role === "patient") {
      const patient = await Patient.findOne({
        $or: [{ user: user._id }, { userId: user._id }, { email: user.email }],
      });

      if (patient) {
        patientInfo = {
          _id: patient._id,
          numeroPatient: patient.numeroPatient,
          nom: patient.nom,
          prenom: patient.prenom,
        };
        console.log("✅ [LOGIN] Patient info found:", patient.numeroPatient);
      } else {
        console.log("⚠️ [LOGIN] No patient profile found for:", email);
      }
    }

    console.log("✅ [LOGIN] Login successful:", user.email);

    // 🔥 CORRECTION CRITIQUE : Token à la racine !
    res.json({
      success: true,
      message: "Connexion réussie",
      token: token, // ✅ TOKEN ICI À LA RACINE !
      user: {
        // ✅ USER SANS TOKEN
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        patientInfo: patientInfo,
        // ❌ PAS de token ici !
      },
    });
  } catch (error) {
    console.error("❌ [LOGIN] Error:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la connexion",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur non trouvé",
      });
    }

    // Si c'est un patient, récupérer ses infos
    let patientInfo = null;
    if (user.role === "patient") {
      const patient = await Patient.findOne({
        $or: [{ user: user._id }, { userId: user._id }, { email: user.email }],
      });

      if (patient) {
        patientInfo = {
          _id: patient._id,
          numeroPatient: patient.numeroPatient,
          nom: patient.nom,
          prenom: patient.prenom,
        };
      }
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        patientInfo: patientInfo,
      },
    });
  } catch (error) {
    console.error("❌ [GET ME] Error:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear token client-side)
 * @access  Private
 */
router.post("/logout", protect, (req, res) => {
  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
});

module.exports = router;
