import { FiClock } from "react-icons/fi";
import styles from "./Dashboard.module.css";

const RecentActivities = ({ activities = [] }) => {
  const defaultActivities = [
    {
      id: 1,
      type: "appointment",
      message: "New appointment scheduled",
      patient: "John Doe",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "test",
      message: "Lab test completed",
      patient: "Jane Smith",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "patient",
      message: "New patient registered",
      patient: "Mike Johnson",
      time: "6 hours ago",
    },
  ];

  const displayActivities =
    activities.length > 0 ? activities : defaultActivities;

  return (
    <div className={styles["card"]}>
      <div className={styles["card-header"]}>
        <h2>Recent Activities</h2>
      </div>
      <div className={styles["activities-list"]}>
        {displayActivities.map((activity) => (
          <div key={activity.id} className={styles["activity-item"]}>
            <div className={`activity-icon activity-${activity.type}`}>
              <FiClock />
            </div>
            <div className={styles["activity-content"]}>
              <p className={styles["activity-message"]}>{activity.message}</p>
              <span className={styles["activity-patient"]}>
                {activity.patient}
              </span>
            </div>
            <span className={styles["activity-time"]}>{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
