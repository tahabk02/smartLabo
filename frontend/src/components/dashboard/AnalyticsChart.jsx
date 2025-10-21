import { useState } from "react";
import styles from "./Dashboard.module.css";

const AnalyticsChart = ({ data = [] }) => {
  const [period, setPeriod] = useState("week");

  const defaultData = [
    { month: "Jan", patients: 40, appointments: 65, tests: 55 },
    { month: "Feb", patients: 55, appointments: 75, tests: 70 },
    { month: "Mar", patients: 65, appointments: 85, tests: 80 },
    { month: "Apr", patients: 75, appointments: 95, tests: 90 },
    { month: "May", patients: 85, appointments: 105, tests: 100 },
    { month: "Jun", patients: 95, appointments: 115, tests: 110 },
  ];

  const chartData = data.length > 0 ? data : defaultData;
  const maxValue = Math.max(
    ...chartData.flatMap((d) => [d.patients, d.appointments, d.tests])
  );

  return (
    <div className={styles["card"]}>
      <div className={styles["card-header"]}>
        <h2>Analytics Overview</h2>
        <div className={styles["chart-filters"]}>
          <button
            className={period === "week" ? "active" : ""}
            onClick={() => setPeriod("week")}
          >
            Week
          </button>
          <button
            className={period === "month" ? "active" : ""}
            onClick={() => setPeriod("month")}
          >
            Month
          </button>
          <button
            className={period === "year" ? "active" : ""}
            onClick={() => setPeriod("year")}
          >
            Year
          </button>
        </div>
      </div>
      <div className={styles["chart-container"]}>
        <div className={styles["chart-legend"]}>
          <div className={styles["legend-item"]}>
            <span
              className={styles["legend-color"]}
              style={{ background: "#667eea" }}
            ></span>
            Patients
          </div>
          <div className={styles["legend-item"]}>
            <span
              className={styles["legend-color"]}
              style={{ background: "#48bb78" }}
            ></span>
            Appointments
          </div>
          <div className={styles["legend-item"]}>
            <span
              className={styles["legend-color"]}
              style={{ background: "#f6ad55" }}
            ></span>
            Tests
          </div>
        </div>
        <div className={styles["chart"]}>
          {chartData.map((item, index) => (
            <div key={index} className={styles["chart-bar-group"]}>
              <div className={styles["chart-bars"]}>
                <div
                  className={styles["chart-bar"] + " " + styles["bar-patients"]}
                  style={{ height: `${(item.patients / maxValue) * 100}%` }}
                  title={`Patients: ${item.patients}`}
                ></div>
                <div
                  className={
                    styles["chart-bar"] + " " + styles["bar-appointments"]
                  }
                  style={{ height: `${(item.appointments / maxValue) * 100}%` }}
                  title={`Appointments: ${item.appointments}`}
                ></div>
                <div
                  className={styles["chart-bar"] + " " + styles["bar-tests"]}
                  style={{ height: `${(item.tests / maxValue) * 100}%` }}
                  title={`Tests: ${item.tests}`}
                ></div>
              </div>
              <span className={styles["chart-label"]}>{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
