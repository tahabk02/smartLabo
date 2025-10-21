import { useState } from "react";
import {
  FiCheckCircle,
  FiCircle,
  FiClock,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./Dashboard.module.css";

const TodayTasks = ({ tasks = [] }) => {
  const defaultTasks = [
    {
      id: 1,
      title: "Review lab results for John Doe",
      priority: "high",
      time: "09:00 AM",
      completed: false,
    },
    {
      id: 2,
      title: "Prepare monthly financial report",
      priority: "medium",
      time: "11:00 AM",
      completed: false,
    },
    {
      id: 3,
      title: "Team meeting - Discuss new procedures",
      priority: "high",
      time: "02:00 PM",
      completed: true,
    },
    {
      id: 4,
      title: "Follow up with pending patients",
      priority: "medium",
      time: "04:00 PM",
      completed: false,
    },
    {
      id: 5,
      title: "Update inventory records",
      priority: "low",
      time: "05:00 PM",
      completed: false,
    },
  ];

  const [taskList, setTaskList] = useState(
    tasks.length > 0 ? tasks : defaultTasks
  );

  const toggleTask = (taskId) => {
    setTaskList(
      taskList.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = taskList.filter((t) => t.completed).length;
  const totalCount = taskList.length;

  return (
    <div className={styles["card"]}>
      <div className={styles["card-header"]}>
        <h2>Today's Tasks</h2>
        <div className={styles["tasks-progress"]}>
          {completedCount}/{totalCount} completed
        </div>
      </div>
      <div className={styles["tasks-list"]}>
        {taskList.map((task) => (
          <div
            key={task.id}
            className={`task-item ${task.completed ? "task-completed" : ""}`}
            onClick={() => toggleTask(task.id)}
          >
            <div className={styles["task-checkbox"]}>
              {task.completed ? (
                <FiCheckCircle className={styles["icon-checked"]} />
              ) : (
                <FiCircle className={styles["icon-unchecked"]} />
              )}
            </div>
            <div className={styles["task-content"]}>
              <h4 className={styles["task-title"]}>{task.title}</h4>
              <div className={styles["task-meta"]}>
                <span className={styles["task-time"]}>
                  <FiClock size={12} />
                  {task.time}
                </span>
                <span className={`task-priority priority-${task.priority}`}>
                  {task.priority === "high" && <FiAlertCircle size={12} />}
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles["progress-bar-container"]}>
        <div
          className={styles["progress-bar"]}
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TodayTasks;
