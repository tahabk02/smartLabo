const express = require("express");
const router = express.Router();
const {
  uploadAndInterpret,
  getInterpretation,
  getAllInterpretations,
} = require("../controllers/aiAgentController");
const { protect } = require("../middleware/authMiddleware");
const roleCheck = require("../middleware/roleCheck");
const upload = require("../middleware/uploadMiddleware");

// Appliquer protect à toutes les routes
router.use(protect);

router.post(
  "/interpret",
  roleCheck("admin", "doctor", "lab_tech"),
  upload.single("analysisFile"),
  uploadAndInterpret
);

router.get(
  "/interpretations/:id",
  roleCheck("admin", "doctor", "lab_tech"),
  getInterpretation
);

router.get(
  "/interpretations",
  roleCheck("admin", "doctor"),
  getAllInterpretations
);

module.exports = router;
