const Task = require("../models/Task");

// إنشاء مهمة جديدة
const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    const populatedTask = await Task.findById(task._id)
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "name specialty");

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// الحصول على جميع المهام
const getTasks = async (req, res) => {
  try {
    const { status, priority, patient, doctor } = req.query;

    // بناء الفلترة
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;

    const tasks = await Task.find(filter)
      .populate("patient", "firstName lastName phone")
      .populate("doctor", "name specialty")
      .populate("completedBy", "name")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// الحصول على مهمة واحدة
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("patient")
      .populate("doctor")
      .populate("completedBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "المهمة غير موجودة" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// تحديث مهمة
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("patient", "firstName lastName")
      .populate("doctor", "name specialty")
      .populate("completedBy", "name");

    if (!task) {
      return res.status(404).json({ message: "المهمة غير موجودة" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// تحديث حالة المهمة
const updateTaskStatus = async (req, res) => {
  try {
    const { status, results } = req.body;

    const updateData = { status };

    // إذا كانت المهمة مكتملة
    if (status === "completed") {
      updateData.completedAt = Date.now();
      updateData.completedBy = req.user._id;
      if (results) updateData.results = results;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("patient", "firstName lastName")
      .populate("doctor", "name specialty")
      .populate("completedBy", "name");

    if (!task) {
      return res.status(404).json({ message: "المهمة غير موجودة" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// حذف مهمة
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "المهمة غير موجودة" });
    }

    res.json({ message: "تم حذف المهمة بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// إحصائيات المهام
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskStats,
};
