// backend/routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// @route   GET /api/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    // Format for frontend
    const formattedNotifications = notifications.map((notif) => ({
      id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      unread: notif.unread,
      link: notif.link,
      time: notif.time,
    }));

    res.json(formattedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/notifications
// @desc    Create new notification
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      userId: req.user.id,
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.unread = false;
    await notification.save();

    res.json({ id: notification._id, unread: false });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
