import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTasks,
  deleteTask,
  updateTaskStatus,
  setFilters,
  clearError,
} from "./tasksSlice";
import TaskModal from "./TaskModal";
import Loader from "../../components/Loader";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
} from "react-icons/fi";
import { toast } from "react-toastify";
import styles from "./Tasks.module.css";

const TasksPage = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error, filters } = useSelector(
    (state) => state.tasks
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Load tasks on mount
  useEffect(() => {
    console.log("🔍 Loading tasks page...");
    dispatch(fetchTasks());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // ==================== HANDLERS ====================

  const handleDelete = async (id) => {
    if (window.confirm("⚠️ Are you sure you want to delete this task?")) {
      try {
        await dispatch(deleteTask(id)).unwrap();
        toast.success("Task deleted successfully 🗑️");
      } catch (err) {
        toast.error(err || "Error deleting task");
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateTaskStatus({ id, status })).unwrap();

      const statusEmojis = {
        pending: "⏳",
        "in-progress": "🔄",
        completed: "✅",
      };

      toast.success(`Task status updated ${statusEmojis[status]}`);
    } catch (err) {
      toast.error(err || "Error updating status");
    }
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleStatusFilter = (e) => {
    dispatch(setFilters({ status: e.target.value }));
  };

  const handlePriorityFilter = (e) => {
    dispatch(setFilters({ priority: e.target.value }));
  };

  const handleClearFilters = () => {
    dispatch(setFilters({ search: "", status: "all", priority: "all" }));
  };

  // ==================== FILTERS ====================

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      task.patient?.name?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesStatus =
      filters.status === "all" || task.status === filters.status;
    const matchesPriority =
      filters.priority === "all" || task.priority === filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ==================== STATISTICS ====================

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    highPriority: tasks.filter((t) => t.priority === "high").length,
  };

  // ==================== RENDER ====================

  if (loading && tasks.length === 0) {
    return <Loader fullscreen message="Loading tasks..." />;
  }

  return (
    <div className={styles["tasks-page"]}>
      {/* Header */}
      <div className={styles["page-header"]}>
        <div>
          <h1>Tasks Management</h1>
          <p className={styles["page-subtitle"]}>
            {stats.total} total tasks • {stats.pending} pending •{" "}
            {stats.completed} completed
          </p>
        </div>
        <button
          onClick={handleAdd}
          className={styles["btn"] + " " + styles["btn-primary"]}
        >
          <FiPlus /> Add Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles["stats-row"]}>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-value"]}>{stats.pending}</div>
          <div className={styles["stat-label"]}>⏳ Pending</div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-value"]}>{stats.inProgress}</div>
          <div className={styles["stat-label"]}>🔄 In Progress</div>
        </div>
        <div className={styles["stat-card"]}>
          <div className={styles["stat-value"]}>{stats.completed}</div>
          <div className={styles["stat-label"]}>✅ Completed</div>
        </div>
        <div className={styles["stat-card"] + " " + styles["highlight"]}>
          <div className={styles["stat-value"]}>{stats.highPriority}</div>
          <div className={styles["stat-label"]}>🔴 High Priority</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles["card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search tasks or patients..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          <select value={filters.status} onChange={handleStatusFilter}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="in-progress">🔄 In Progress</option>
            <option value="completed">✅ Completed</option>
          </select>

          <select value={filters.priority} onChange={handlePriorityFilter}>
            <option value="all">All Priority</option>
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🔴 High</option>
          </select>

          {(filters.search ||
            filters.status !== "all" ||
            filters.priority !== "all") && (
            <button
              onClick={handleClearFilters}
              className={
                styles["btn"] +
                " " +
                styles["btn-secondary"] +
                " " +
                styles["btn-sm"]
              }
            >
              <FiFilter /> Clear Filters
            </button>
          )}
        </div>

        {/* Tasks Grid */}
        <div className={styles["tasks-grid"]}>
          {filteredTasks.length === 0 ? (
            <div className={styles["no-tasks"]}>
              <div className={styles["no-tasks-icon"]}>📋</div>
              <h3>No tasks found</h3>
              <p>
                {filters.search ||
                filters.status !== "all" ||
                filters.priority !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first task to get started"}
              </p>
              {tasks.length === 0 && (
                <button
                  onClick={handleAdd}
                  className={styles["btn"] + " " + styles["btn-primary"]}
                >
                  <FiPlus /> Create First Task
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task._id}
                className={`task-card priority-${task.priority}`}
              >
                {/* Task Header */}
                <div className={styles["task-header"]}>
                  <h3>{task.title}</h3>
                  <span className={`priority-badge ${task.priority}`}>
                    {task.priority === "high" && "🔴"}
                    {task.priority === "medium" && "🟡"}
                    {task.priority === "low" && "🟢"} {task.priority}
                  </span>
                </div>

                {/* Task Description */}
                {task.description && (
                  <p className={styles["task-description"]}>
                    {task.description}
                  </p>
                )}

                {/* Task Meta */}
                <div className={styles["task-meta"]}>
                  <span className={styles["task-patient"]}>
                    <FiUser /> {task.patient?.name || "Unknown Patient"}
                  </span>
                  <span className={styles["task-due"]}>
                    <FiCalendar />{" "}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "No due date"}
                  </span>
                </div>

                {/* Task Footer */}
                <div className={styles["task-footer"]}>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task._id, e.target.value)
                    }
                    className={`status-select ${task.status}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>

                  <div className={styles["action-buttons"]}>
                    <button
                      onClick={() => handleEdit(task)}
                      className={styles["btn-icon"]}
                      title="Edit task"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className={
                        styles["btn-icon"] + " " + styles["btn-danger"]
                      }
                      title="Delete task"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TasksPage;
