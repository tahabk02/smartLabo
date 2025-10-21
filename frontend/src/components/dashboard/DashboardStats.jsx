import styles from "./DashboardStats.module.css";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../features/dashboard/dashboardSlice";

function DashboardStats() {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboardStats());
  };

  const statsCards = [
    {
      title: "Total Patients",
      value: stats?.totalPatients || 0,
      icon: "👥",
      color: "#3b82f6",
      bgColor: "#dbeafe",
      trend: "+12%",
    },
    {
      title: "Analyses",
      value: stats?.totalAnalyses || 0,
      icon: "🔬",
      color: "#10b981",
      bgColor: "#d1fae5",
      trend: "+8%",
    },
    {
      title: "Factures",
      value: stats?.totalFactures || 0,
      icon: "📄",
      color: "#f59e0b",
      bgColor: "#fef3c7",
      trend: "+5%",
    },
    {
      title: "Revenu Mensuel",
      value: `${(stats?.revenuMensuel || 0).toLocaleString()} DH`,
      icon: "💰",
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      trend: "+15%",
    },
  ];

  if (error) {
    return (
      <div className={styles["dashboard-stats"] + " " + styles["error"]}>
        <p>❌ Erreur: {error}</p>
        <button onClick={handleRefresh}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className={styles["dashboard-stats"]}>
      <div className={styles["stats-header"]}>
        <h2>📊 Statistiques du Jour</h2>
        <button
          className={styles["btn-refresh"]}
          onClick={handleRefresh}
          disabled={loading}
        >
          <span className={loading ? "spinning" : ""}>🔄</span>
          Actualiser
        </button>
      </div>

      <div className={styles["stats-grid"]}>
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className={styles["stat-card"]}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div
              className={styles["stat-icon"]}
              style={{ backgroundColor: stat.bgColor, color: stat.color }}
            >
              <span className={styles["icon-emoji"]}>{stat.icon}</span>
            </div>
            <div className={styles["stat-content"]}>
              <h3>{stat.title}</h3>
              <p className={styles["stat-value"]}>
                {loading ? "..." : stat.value}
              </p>
              <span className={styles["stat-trend"] + " " + styles["positive"]}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles["secondary-stats"]}>
        <div className={styles["secondary-stat"]}>
          <span>Factures en attente:</span>
          <strong>{stats?.facturesEnAttente || 0}</strong>
        </div>
        <div className={styles["secondary-stat"]}>
          <span>Analyses en cours:</span>
          <strong>{stats?.analysesEnCours || 0}</strong>
        </div>
        <div className={styles["secondary-stat"]}>
          <span>Tâches aujourd'hui:</span>
          <strong>{stats?.tachesAujourdhui || 0}</strong>
        </div>
        <div className={styles["secondary-stat"]}>
          <span>Taux d'occupation:</span>
          <strong>{stats?.tauxOccupation || 0}%</strong>
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
