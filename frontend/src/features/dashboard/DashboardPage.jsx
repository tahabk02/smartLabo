import React, { useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import DashboardStats from "../../components/dashboard/DashboardStats";
import RecentPatients from "../../components/dashboard/RecentPatients";
import PendingInvoices from "../../components/dashboard/PendingInvoices";
import TodayTasks from "../../components/dashboard/TodayTasks";
import styles from "./DashboardPage.module.css";

// Redux actions
import {
  fetchDashboardStats,
  fetchRecentActivities,
  fetchAnalytics,
  fetchRecentPatients,
  fetchPendingInvoices,
  fetchTodayTasks,
} from "../../features/dashboard/dashboardSlice";

// AI Components
import ChatWidget from "../../components/ChatWidget";
import AIAgent from "../../components/AIAgent";
import ConversationMonitor from "../../components/ConversationMonitor";

function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Charger toutes les données au montage du composant
  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentActivities(10));
    dispatch(fetchAnalytics());
    dispatch(fetchRecentPatients(5));
    dispatch(fetchPendingInvoices());
    dispatch(fetchTodayTasks());
  }, [dispatch]);

  // Mémorisation du greeting pour éviter les recalculs
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  // Mémorisation de la date actuelle
  const currentDate = useMemo(() => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("fr-FR", options);
  }, []);

  // Actions rapides avec navigation
  const handleQuickAction = useCallback(
    (action) => {
      switch (action) {
        case "newPatient":
          navigate("/patients/nouveau");
          break;
        case "newAnalysis":
          navigate("/analyses/nouveau");
          break;
        case "newInvoice":
          navigate("/factures/nouveau");
          break;
        default:
          break;
      }
    },
    [navigate]
  );

  // Configuration des liens rapides
  const quickLinks = useMemo(
    () => [
      { path: "/patients", icon: "👥", label: "Patients", color: "#667eea" },
      { path: "/doctors", icon: "👨‍⚕️", label: "Médecins", color: "#f093fb" },
      { path: "/tasks", icon: "📋", label: "Tâches", color: "#4ade80" },
      { path: "/factures", icon: "💰", label: "Factures", color: "#fbbf24" },
      { path: "/users", icon: "⚙️", label: "Utilisateurs", color: "#8b5cf6" },
      { path: "/settings", icon: "🔧", label: "Paramètres", color: "#64748b" },
    ],
    []
  );

  // Configuration des boutons d'action rapide
  const quickActions = useMemo(
    () => [
      {
        key: "newPatient",
        icon: "➕",
        label: "Nouveau Patient",
        ariaLabel: "Ajouter un nouveau patient",
      },
      {
        key: "newAnalysis",
        icon: "🔬",
        label: "Nouvelle Analyse",
        ariaLabel: "Créer une nouvelle analyse",
      },
      {
        key: "newInvoice",
        icon: "📄",
        label: "Nouvelle Facture",
        ariaLabel: "Créer une nouvelle facture",
      },
    ],
    []
  );

  return (
    <div className={styles["dashboard-page"]}>
      {/* Header avec gradient et actions rapides */}
      <header className={styles["dashboard-header"]} role="banner">
        <div className={styles["header-content"]}>
          <h1>
            {greeting}, {user?.nom || user?.prenom || "Utilisateur"} 👋
          </h1>
          <p className={styles["header-date"]}>
            <span aria-label="Calendrier">📅</span> {currentDate}
          </p>
        </div>

        <nav
          className={styles["header-quick-actions"]}
          aria-label="Actions rapides"
        >
          {quickActions.map((action) => (
            <button
              key={action.key}
              className={styles["quick-action-btn"]}
              onClick={() => handleQuickAction(action.key)}
              aria-label={action.ariaLabel}
            >
              <span aria-hidden="true">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ==================== Section AI ==================== */}
      <section
        aria-label="Intelligence Artificielle"
        style={{ marginTop: "2rem" }}
      >
        <h2>🤖 SmartLabo AI</h2>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <ChatWidget />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <AIAgent />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <ConversationMonitor />
          </div>
        </div>
      </section>

      {/* Section des statistiques */}
      <section aria-label="Statistiques du tableau de bord">
        <DashboardStats />
      </section>

      {/* Grille principale du contenu */}
      <div className={styles["dashboard-grid"]}>
        {/* Colonne gauche */}
        <div className={styles["dashboard-col-left"]}>
          <section aria-label="Patients récents">
            <RecentPatients />
          </section>
          <section aria-label="Factures en attente">
            <PendingInvoices />
          </section>
        </div>

        {/* Colonne droite */}
        <div className={styles["dashboard-col-right"]}>
          <section aria-label="Tâches du jour">
            <TodayTasks />
          </section>

          {/* Carte d'accès rapide */}
          <section aria-label="Liens d'accès rapide">
            <div
              className={
                styles["dashboard-card"] + " " + styles["quick-links-card"]
              }
            >
              <div className={styles["card-header"]}>
                <h3>
                  <span className={styles["header-icon"]} aria-hidden="true">
                    ⚡
                  </span>
                  Accès Rapide
                </h3>
              </div>
              <div className={styles["card-body"]}>
                <nav
                  className={styles["quick-links-grid"]}
                  aria-label="Navigation rapide"
                >
                  {quickLinks.map((link) => (
                    <a
                      key={link.path}
                      href={link.path}
                      className={styles["quick-link"]}
                      style={{ "--link-color": link.color }}
                      aria-label={`Accéder à ${link.label}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(link.path);
                      }}
                    >
                      <span
                        className={styles["quick-link-icon"]}
                        aria-hidden="true"
                      >
                        {link.icon}
                      </span>
                      <span className={styles["quick-link-text"]}>
                        {link.label}
                      </span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
