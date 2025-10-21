const Patient = require("../models/Patient");

// إضافة مريض جديد
const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// الحصول على جميع المرضى
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على مريض واحد
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "المريض غير موجود" });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث مريض
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!patient) {
      return res.status(404).json({ message: "المريض غير موجود" });
    }
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// حذف مريض
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "المريض غير موجود" });
    }
    res.json({ message: "تم حذف المريض بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
