const express = require("express");
const router = express.Router();
const Task = require("../models/Tasks");
const { protect } = require("../middleware/authMiddleware");

// GET all tasks
router.get("/", protect, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("patient", "name age")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error fetching tasks" });
  }
});

// POST new task
router.post("/", protect, async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate("patient", "name age");
    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error creating task" });
  }
});

// PATCH task status
router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("patient", "name age");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Server error updating task" });
  }
});

// DELETE task
router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Server error deleting task" });
  }
});

module.exports = router;
