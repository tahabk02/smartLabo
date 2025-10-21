const Patient = require("../models/Patient");
const Task = require("../models/Task");
const Facture = require("../models/Facture");
const User = require("../models/User");

// إحصائيات عامة للـ Dashboard
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // عدد المرضى
    const totalPatients = await Patient.countDocuments();
    const newPatientsToday = await Patient.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // إحصائيات المهام
    const totalTasks = await Task.countDocuments();
    const tasksToday = await Task.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });
    const pendingTasks = await Task.countDocuments({ status: "pending" });
    const inProgressTasks = await Task.countDocuments({
      status: "in_progress",
    });
    const completedTasks = await Task.countDocuments({ status: "completed" });

    // إحصائيات الفواتير
    const totalRevenue = await Facture.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          paid: { $sum: "$paidAmount" },
        },
      },
    ]);

    const revenueToday = await Facture.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
          paid: { $sum: "$paidAmount" },
        },
      },
    ]);

    const unpaidFactures = await Facture.countDocuments({
      status: { $in: ["unpaid", "partial"] },
    });

    // المستخدمين النشطين
    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      patients: {
        total: totalPatients,
        today: newPatientsToday,
      },
      tasks: {
        total: totalTasks,
        today: tasksToday,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        paid: totalRevenue[0]?.paid || 0,
        unpaid: (totalRevenue[0]?.total || 0) - (totalRevenue[0]?.paid || 0),
        today: revenueToday[0]?.total || 0,
      },
      factures: {
        unpaid: unpaidFactures,
      },
      users: {
        active: activeUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// إحصائيات الأسبوع الحالي
const getWeeklyStats = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // المرضى الجدد هذا الأسبوع
    const patientsThisWeek = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // المهام هذا الأسبوع
    const tasksThisWeek = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // الإيرادات هذا الأسبوع
    const revenueThisWeek = await Facture.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          total: { $sum: "$totalAmount" },
          paid: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      patients: patientsThisWeek,
      tasks: tasksThisWeek,
      revenue: revenueThisWeek,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// إحصائيات الشهر الحالي
const getMonthlyStats = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // المرضى حسب اليوم
    const patientsByDay = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // الإيرادات حسب اليوم
    const revenueByDay = await Facture.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: "$totalAmount" },
          paid: { $sum: "$paidAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // المهام حسب الحالة
    const tasksByStatus = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      patients: patientsByDay,
      revenue: revenueByDay,
      tasks: tasksByStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// أحدث الأنشطة
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // أحدث المرضى
    const recentPatients = await Patient.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("firstName lastName createdAt");

    // أحدث المهام
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("patient", "firstName lastName")
      .select("type status createdAt");

    // أحدث الفواتير
    const recentFactures = await Facture.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("patient", "firstName lastName")
      .select("totalAmount status createdAt");

    res.json({
      patients: recentPatients,
      tasks: recentTasks,
      factures: recentFactures,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getWeeklyStats,
  getMonthlyStats,
  getRecentActivities,
};
