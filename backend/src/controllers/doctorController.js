const Doctor = require("../models/Doctor");

// إضافة طبيب جديد
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// الحصول على جميع الأطباء
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على طبيب واحد
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "الطبيب غير موجود" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث طبيب
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({ message: "الطبيب غير موجود" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// حذف طبيب
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "الطبيب غير موجود" });
    }

    res.status(200).json({ message: "تم حذف الطبيب بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
};
