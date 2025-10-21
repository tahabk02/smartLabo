import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTask, updateTask } from "./tasksSlice";
import { fetchPatients } from "../patients/patientsSlice";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import styles from "./Tasks.module.css";

const TaskModal = ({ task, onClose }) => {
  const dispatch = useDispatch();

  // Safe access to patients state
  const patientsState = useSelector((state) => state.patients);
  const patients = patientsState?.patients || [];
  const patientsLoading = patientsState?.loading || false;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    patient: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });
  // Fetch patients on mount
  useEffect(() => {
    console.log("🔍 Fetching patients for task modal...");
    dispatch(fetchPatients());
  }, [dispatch]);

  // Populate form if editing existing task
  useEffect(() => {
    if (task) {
      console.log("📝 Editing task:", task);
      setFormData({
        title: task.title || "",
        description: task.description || "",
        patient: task.patient?._id || "",
        priority: task.priority || "medium",
        status: task.status || "pending",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.patient) {
      toast.error("Please select a patient");
      return;
    }

    if (!formData.dueDate) {
      toast.error("Due date is required");
      return;
    }

    setLoading(true);

    try {
      if (task) {
        await dispatch(
          updateTask({ id: task._id, taskData: formData })
        ).unwrap();
        toast.success("Task updated successfully ✅");
      } else {
        await dispatch(createTask(formData)).unwrap();
        toast.success("Task created successfully ✅");
      }
      onClose();
    } catch (err) {
      console.error("❌ Task submit error:", err);
      toast.error(err || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{task ? "Edit Task" : "Add New Task"}</h2>
          <button
            onClick={onClose}
            className={styles["modal-close"]}
            type="button"
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className={styles["form-group"]}>
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className={styles["form-control"]}
              placeholder="Enter task title"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className={styles["form-group"]}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles["form-control"]}
              rows="3"
              placeholder="Enter task description (optional)"
              disabled={loading}
            />
          </div>

          <div className={styles["form-row"]}>
            {/* Patient Selection */}
            <div className={styles["form-group"]}>
              <label>Patient *</label>
              <select
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                required
                className={styles["form-control"]}
                disabled={loading || patientsLoading}
              >
                <option value="">
                  {patientsLoading ? "Loading patients..." : "Select Patient"}
                </option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} - {p.age} years ({p.gender})
                  </option>
                ))}
              </select>
              {patients.length === 0 && !patientsLoading && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  No patients found. Please add patients first.
                </small>
              )}
            </div>

            {/* Due Date */}
            <div className={styles["form-group"]}>
              <label>Due Date *</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className={styles["form-control"]}
                min={new Date().toISOString().split("T")[0]}
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles["form-row"]}>
            {/* Priority */}
            <div className={styles["form-group"]}>
              <label>Priority *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className={styles["form-control"]}
                disabled={loading}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>

            {/* Status */}
            <div className={styles["form-group"]}>
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={styles["form-control"]}
                disabled={loading}
              >
                <option value="pending">⏳ Pending</option>
                <option value="in-progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className={styles["modal-actions"]}>
            <button
              type="button"
              onClick={onClose}
              className={styles["btn"] + " " + styles["btn-secondary"]}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles["btn"] + " " + styles["btn-primary"]}
              disabled={loading || patients.length === 0}
            >
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
