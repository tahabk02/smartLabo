// backend/routes/doctors.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Doctor = require("../models/Doctor");
const { protect, authorize } = require("../middleware/authMiddleware");

// 📂 Setup upload directory
const uploadDir = path.join(__dirname, "../uploads/doctors");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Upload directory created:", uploadDir);
}

// 📸 Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, png, webp) are allowed"));
    }
  },
});

// ✅ Serve static uploads
router.use("/uploads", express.static(uploadDir));

/* ------------------------------------------------------------------ */
/*                          ROUTES                                    */
/* ------------------------------------------------------------------ */

// 📋 GET all doctors
router.get("/", protect, async (req, res) => {
  try {
    console.log("📡 GET /api/doctors - User:", req.user?.email);

    const doctors = await Doctor.find().sort({ createdAt: -1 });

    console.log(`✅ Returning ${doctors.length} doctors`);
    res.json(doctors);
  } catch (error) {
    console.error("❌ Error fetching doctors:", error);
    res.status(500).json({
      message: "Server error while fetching doctors",
      error: error.message,
    });
  }
});

// 👤 GET doctor by ID
router.get("/:id", protect, async (req, res) => {
  try {
    console.log("📡 GET /api/doctors/:id - ID:", req.params.id);

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      console.log("❌ Doctor not found:", req.params.id);
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log("✅ Doctor found:", doctor.name);
    res.json(doctor);
  } catch (error) {
    console.error("❌ Error fetching doctor:", error);
    res.status(500).json({
      message: "Server error while fetching doctor",
      error: error.message,
    });
  }
});

// 🟢 CREATE new doctor (with optional photo)
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("photo"),
  async (req, res) => {
    try {
      console.log("📡 POST /api/doctors - Creating new doctor");
      console.log("Body:", req.body);
      console.log("File:", req.file?.filename);

      const { email } = req.body;

      // Check if doctor already exists
      const existingDoctor = await Doctor.findOne({ email });
      if (existingDoctor) {
        console.log("❌ Doctor already exists:", email);
        return res.status(400).json({
          message: "Doctor with this email already exists",
        });
      }

      // Prepare doctor data
      const doctorData = { ...req.body };

      // Add photo path if uploaded
      if (req.file) {
        doctorData.photo = `/uploads/doctors/${req.file.filename}`;
        console.log("📸 Photo uploaded:", doctorData.photo);
      }

      // Create doctor
      const doctor = await Doctor.create(doctorData);

      console.log("✅ Doctor created successfully:", doctor.name);
      res.status(201).json(doctor);
    } catch (error) {
      console.error("❌ Error creating doctor:", error);

      // Delete uploaded file if error occurs
      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🗑️ Deleted uploaded file due to error");
        }
      }

      res.status(400).json({
        message: error.message || "Error creating doctor",
        error: error.message,
      });
    }
  }
);

// 🟡 UPDATE doctor (with optional new photo)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("photo"),
  async (req, res) => {
    try {
      console.log("📡 PUT /api/doctors/:id - Updating doctor:", req.params.id);
      console.log("Body:", req.body);
      console.log("File:", req.file?.filename);

      const doctor = await Doctor.findById(req.params.id);

      if (!doctor) {
        console.log("❌ Doctor not found:", req.params.id);

        // Delete uploaded file if doctor not found
        if (req.file) {
          const filePath = path.join(uploadDir, req.file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        return res.status(404).json({ message: "Doctor not found" });
      }

      // Handle photo update
      if (req.file) {
        // Delete old photo if exists
        if (doctor.photo) {
          const oldPath = path.join(__dirname, "..", doctor.photo);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
            console.log("🗑️ Deleted old photo");
          }
        }
        req.body.photo = `/uploads/doctors/${req.file.filename}`;
        console.log("📸 New photo uploaded:", req.body.photo);
      }

      // Update doctor
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

      console.log("✅ Doctor updated successfully:", updatedDoctor.name);
      res.json(updatedDoctor);
    } catch (error) {
      console.error("❌ Error updating doctor:", error);

      // Delete uploaded file if error occurs
      if (req.file) {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("🗑️ Deleted uploaded file due to error");
        }
      }

      res.status(400).json({
        message: error.message || "Error updating doctor",
        error: error.message,
      });
    }
  }
);

// 🔴 DELETE doctor
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    console.log("📡 DELETE /api/doctors/:id - Deleting doctor:", req.params.id);

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      console.log("❌ Doctor not found:", req.params.id);
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Delete photo if exists
    if (doctor.photo) {
      const filePath = path.join(__dirname, "..", doctor.photo);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🗑️ Deleted photo:", doctor.photo);
      }
    }

    await Doctor.findByIdAndDelete(req.params.id);

    console.log("✅ Doctor deleted successfully:", doctor.name);
    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting doctor:", error);
    res.status(500).json({
      message: error.message || "Error deleting doctor",
      error: error.message,
    });
  }
});

// 🔄 TOGGLE doctor status (active/inactive)
router.patch(
  "/:id/toggle-status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      console.log(
        "📡 PATCH /api/doctors/:id/toggle-status - ID:",
        req.params.id
      );

      const doctor = await Doctor.findById(req.params.id);

      if (!doctor) {
        console.log("❌ Doctor not found:", req.params.id);
        return res.status(404).json({ message: "Doctor not found" });
      }

      doctor.isActive = !doctor.isActive;
      await doctor.save();

      console.log(
        `✅ Doctor status toggled: ${doctor.name} - Active: ${doctor.isActive}`
      );
      res.json(doctor);
    } catch (error) {
      console.error("❌ Error toggling doctor status:", error);
      res.status(500).json({
        message: error.message || "Error toggling doctor status",
        error: error.message,
      });
    }
  }
);

module.exports = router;
