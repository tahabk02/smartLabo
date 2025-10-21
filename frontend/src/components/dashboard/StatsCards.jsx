import styles from './StatsCards.module.css';
import React, { useState, useEffect } from "react";
import {
  FiUsers,
  FiCalendar,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

const StatsCards = ({ stats }) => {
  const [previousStats, setPreviousStats] = useState(null);
  const [trends, setTrends] = useState({});

  // Charger les stats précédentes depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem("previousMonthStats");
    if (stored) {
      try {
        setPreviousStats(JSON.parse(stored));
      } catch (error) {
        console.error(
          "Erreur lors du chargement des stats précédentes:",
          error
        );
      }
    }
  }, []);

  // Calculer les tendances réelles
  useEffect(() => {
    if (stats && previousStats) {
      const calculateTrend = (current, previous) => {
        if (!previous || previous === 0) return { value: 0, isPositive: true };
        const change = ((current - previous) / previous) * 100;
        return {
          value: Math.abs(change).toFixed(1),
          isPositive: change >= 0,
        };
      };

      setTrends({
        patients: calculateTrend(
          stats.totalPatients,
          previousStats.totalPatients
        ),
        appointments: calculateTrend(
          stats.totalAppointments,
          previousStats.totalAppointments
        ),
        tests: calculateTrend(stats.totalTests, previousStats.totalTests),
        revenue: calculateTrend(stats.totalRevenue, previousStats.totalRevenue),
      });
    }
  }, [stats, previousStats]);

  // Fonction pour formater la devise
  const formatCurrency = (amount) => {
    if (!amount) return "0 MAD";
    return new Intl.NumberFormat("fr-MA", {
      style: "currency",
      currency: "MAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fonction pour formater les nombres
  const formatNumber = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  const statsData = [
    {
      title: "Total Patients",
      value: formatNumber(stats?.totalPatients || 0),
      rawValue: stats?.totalPatients || 0,
      icon: <FiUsers />,
      color: "primary",
      trend: trends.patients,
      description: "Patients enregistrés",
    },
    {
      title: "Rendez-vous",
      value: formatNumber(stats?.totalAppointments || 0),
      rawValue: stats?.totalAppointments || 0,
      icon: <FiCalendar />,
      color: "success",
      trend: trends.appointments,
      description: "RDV ce mois",
    },
    {
      title: "Analyses",
      value: formatNumber(stats?.totalTests || 0),
      rawValue: stats?.totalTests || 0,
      icon: <FiFileText />,
      color: "warning",
      trend: trends.tests,
      description: "Tests effectués",
    },
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(stats?.totalRevenue || 0),
      rawValue: stats?.totalRevenue || 0,
      icon: <FiTrendingUp />,
      color: "danger",
      trend: trends.revenue,
      description: "Revenue du mois",
    },
  ];

  return (
    <div className={styles["stats-grid"]}>
      {statsData.map((stat, index) => (
        <div
          key={index}
          className={`stat-card stat-${stat.color}`}
          role="article"
          aria-label={`${stat.title}: ${stat.value}`}
        >
          <div className={styles["stat-icon"]} aria-hidden="true">
            {stat.icon}
          </div>
          <div className={styles["stat-content"]}>
            <h3 className={styles["stat-value"]} title={stat.rawValue.toLocaleString()}>
              {stat.value}
            </h3>
            <p className={styles["stat-title"]}>{stat.title}</p>
            <p className={styles["stat-description"]}>{stat.description}</p>
            {stat.trend && stat.trend.value > 0 ? (
              <span
                className={`stat-trend ${
                  stat.trend.isPositive ? "trend-positive" : "trend-negative"
                }`}
                aria-label={`${
                  stat.trend.isPositive ? "Augmentation" : "Diminution"
                } de ${stat.trend.value}% par rapport au mois dernier`}
              >
                {stat.trend.isPositive ? (
                  <FiTrendingUp className={styles["trend-icon"]} />
                ) : (
                  <FiTrendingDown className={styles["trend-icon"]} />
                )}
                {stat.trend.isPositive ? "+" : "-"}
                {stat.trend.value}% vs mois dernier
              </span>
            ) : (
              <span className={styles["stat-trend"] + " " + styles["stat-trend-neutral"]}>
                Nouvelles données
              </span>
            )}
          </div>
          <div className={styles["stat-badge"]}>
            <span className={styles["badge-dot"]}></span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
