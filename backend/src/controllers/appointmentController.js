// controllers/appointmentController.js
const Appointment = require("../models/Appointment");

// ============================================
// Récupérer tous les RDV avec filtres
// ============================================
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, dateDebut, dateFin, patient } = req.query;

    let filter = {};

    // Filtrer par statut
    if (status) {
      filter.status = status;
    }

    // Filtrer par patient
    if (patient) {
      filter.patient = patient;
    }

    // Filtrer par date
    if (dateDebut || dateFin) {
      filter.date = {};
      if (dateDebut) filter.date.$gte = new Date(dateDebut);
      if (dateFin) filter.date.$lte = new Date(dateFin);
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "nom prenom telephone email cin")
      .populate("analyses", "nom description prix")
      .populate("confirmedBy", "nom prenom role")
      .populate("facture")
      .sort({ date: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Récupérer un RDV par ID
// ============================================
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "nom prenom telephone email cin dateNaissance")
      .populate("analyses", "nom description prix duree")
      .populate("confirmedBy", "nom prenom role")
      .populate("facture");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Créer un nouveau RDV
// ============================================
exports.createAppointment = async (req, res) => {
  try {
    const { patient, date, analyses, notes } = req.body;

    // Validation
    if (!patient || !date || !analyses || analyses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patient, date et analyses sont obligatoires",
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patient,
      date,
      analyses,
      notes,
    });

    // Populate les données
    await appointment.populate("patient", "nom prenom telephone email");
    await appointment.populate("analyses", "nom description prix");

    res.status(201).json({
      success: true,
      message: "Rendez-vous créé avec succès",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Modifier un RDV
// ============================================
exports.updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("patient", "nom prenom telephone email")
      .populate("analyses", "nom description prix")
      .populate("confirmedBy", "nom prenom role")
      .populate("facture");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous modifié avec succès",
      data: appointment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Confirmer un RDV
// ============================================
exports.confirmAppointment = async (req, res) => {
  try {
    const { userId } = req.body; // ID de l'utilisateur qui confirme

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "confirmed",
        confirmedBy: userId,
      },
      { new: true }
    )
      .populate("patient", "nom prenom telephone email")
      .populate("analyses", "nom description prix")
      .populate("confirmedBy", "nom prenom role");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous confirmé",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Annuler un RDV
// ============================================
exports.cancelAppointment = async (req, res) => {
  try {
    const { notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    appointment.status = "cancelled";
    if (notes) appointment.notes = notes;

    await appointment.save();

    await appointment.populate("patient", "nom prenom telephone email");
    await appointment.populate("analyses", "nom description prix");

    res.json({
      success: true,
      message: "Rendez-vous annulé",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Marquer RDV comme terminé
// ============================================
exports.completeAppointment = async (req, res) => {
  try {
    const { factureId, notes } = req.body;

    const updateData = {
      status: "done",
    };

    if (factureId) updateData.facture = factureId;
    if (notes) updateData.notes = notes;

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("patient", "nom prenom telephone email")
      .populate("analyses", "nom description prix")
      .populate("facture");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous terminé",
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Supprimer un RDV
// ============================================
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Rendez-vous introuvable",
      });
    }

    res.json({
      success: true,
      message: "Rendez-vous supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Récupérer RDV par patient
// ============================================
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.patientId,
    })
      .populate("analyses", "nom description prix")
      .populate("confirmedBy", "nom prenom")
      .populate("facture")
      .sort({ date: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// Statistiques des RDV
// ============================================
exports.getAppointmentStats = async (req, res) => {
  try {
    const stats = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Appointment.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today },
    });

    res.json({
      success: true,
      data: {
        total,
        today: todayAppointments,
        byStatus: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
