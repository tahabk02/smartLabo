const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ========== PROTECTION GÉNÉRALE ==========
// Compatible avec un modèle User unique

exports.protect = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Accès refusé. Token manquant.",
      });
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier si le compte est actif
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id: user._id,
      _id: user._id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
    });
  }
};

// ========== AUTORISATION PAR RÔLE ==========
// Usage: authorize('admin') ou authorize('admin', 'doctor')

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié. Veuillez vous connecter.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôles autorisés: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

// ========== AUTHENTICATION OPTIONNELLE ==========
// Pour les routes qui fonctionnent avec ou sans auth

exports.optionalAuth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return next();
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = {
        id: user._id,
        _id: user._id,
        role: user.role,
        email: user.email,
      };
    }

    next();
  } catch (error) {
    next();
  }
};

// ========== ALIASES POUR COMPATIBILITÉ ==========

exports.authenticate = exports.protect;
exports.authenticatePatient = exports.protect;
exports.authenticateDoctor = exports.protect;
exports.authenticateAdmin = exports.protect;
