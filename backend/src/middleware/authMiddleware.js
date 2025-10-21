// backend/src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware pour vérifier le token JWT et authentifier l'utilisateur
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token existe dans le header Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Alternative : vérifier avec req.header()
    if (!token && req.header("Authorization")) {
      token = req.header("Authorization").replace("Bearer ", "");
    }

    if (!token) {
      return res.status(401).json({
        message: "Token manquant, accès refusé.",
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Utilisateur introuvable.",
      });
    }

    // Vérifier si le compte est actif
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Compte désactivé.",
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token invalide." });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré." });
    }

    res.status(401).json({ message: "Authentification échouée." });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param  {...string} roles - Les rôles autorisés (admin, receptionist, patient, etc.)
 * @example authorize("admin", "receptionist")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Utilisateur non authentifié.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle requis: ${roles.join(" ou ")}.`,
      });
    }

    next();
  };
};

/**
 * Middleware alternatif pour vérifier le rôle (alias de authorize)
 * Utilisé pour la compatibilité avec l'ancien code
 */
const roleCheck = (...roles) => {
  return authorize(...roles);
};

module.exports = {
  protect,
  authorize,
  roleCheck, // Export pour compatibilité
};
