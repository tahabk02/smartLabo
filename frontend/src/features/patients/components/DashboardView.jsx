// src/features/patients/components/DashboardView.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✨ Import navigation
import {
  Activity,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./DashboardView.module.css";

const DashboardView = ({ onNavigate }) => {
  // ✨ Receive onNavigate prop
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getDashboardStats();
      setStats(data);
      console.log("📊 Dashboard stats loaded:", data);
    } catch (error) {
      console.error("Error loading stats:", error);
      setError("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  };

  // ✨ Navigation handlers
  const handleNavigateToAnalyses = () => {
    if (onNavigate) {
      onNavigate("analyses"); // For PatientDashboard internal navigation
    } else {
      navigate("/patient/analyses"); // Fallback
    }
  };

  const handleNavigateToAppointments = () => {
    if (onNavigate) {
      onNavigate("appointments");
    } else {
      navigate("/patient/appointments");
    }
  };

  const handleNavigateToInvoices = () => {
    if (onNavigate) {
      onNavigate("invoices");
    } else {
      navigate("/patient/invoices");
    }
  };

  const handleNavigateToProfile = () => {
    if (onNavigate) {
      onNavigate("profile");
    } else {
      navigate("/patient/profile");
    }
  };

  const handleViewAnalysis = (analysisId) => {
    console.log("📊 Viewing analysis:", analysisId);
    handleNavigateToAnalyses();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadStats} />;
  }

  if (!stats) {
    return (
      <ErrorMessage message="Aucune donnée disponible" onRetry={loadStats} />
    );
  }

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h2 className={styles.welcomeTitle}>
            Bienvenue dans votre espace santé! 👋
          </h2>
          <p className={styles.welcomeSubtitle}>
            Voici un aperçu de vos données médicales
          </p>
        </div>
        <div className={styles.welcomeIcon}>
          <TrendingUp className={styles.welcomeIconSvg} />
        </div>
      </div>

      {/* Stats Cards Grid - ✨ Clickable */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<Activity className={styles.statIcon} />}
          title="Total Analyses"
          value={stats.analyses?.total || 0}
          subtitle="Analyses effectuées"
          color="blue"
          trend="+12% ce mois"
          onClick={handleNavigateToAnalyses}
        />
        <StatCard
          icon={<Clock className={styles.statIcon} />}
          title="En attente"
          value={stats.analyses?.pending || 0}
          subtitle="Analyses en cours"
          color="yellow"
          trend="À suivre"
          onClick={handleNavigateToAnalyses}
        />
        <StatCard
          icon={<CheckCircle className={styles.statIcon} />}
          title="Terminées"
          value={stats.analyses?.completed || 0}
          subtitle="Résultats disponibles"
          color="green"
          trend="Disponibles"
          onClick={handleNavigateToAnalyses}
        />
        <StatCard
          icon={<DollarSign className={styles.statIcon} />}
          title="Factures"
          value={`${stats.factures?.unpaidAmount || 0} MAD`}
          subtitle="À payer"
          color="red"
          trend={`Total: ${stats.factures?.totalAmount || 0} MAD`}
          onClick={handleNavigateToInvoices}
        />
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Recent Analyses Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <FileText className={styles.sectionIcon} />
              Dernières analyses
            </h3>
            <button
              className={styles.viewAllButton}
              onClick={handleNavigateToAnalyses}
            >
              Voir tout →
            </button>
          </div>

          <div className={styles.analysesList}>
            {stats.recentAnalyses?.length > 0 ? (
              stats.recentAnalyses.map((analysis, index) => (
                <AnalysisItem
                  key={analysis._id}
                  analysis={analysis}
                  index={index}
                  onClick={() => handleViewAnalysis(analysis._id)}
                />
              ))
            ) : (
              <EmptyState
                icon={<FileText className={styles.emptyIcon} />}
                message="Aucune analyse récente"
                description="Vos analyses apparaîtront ici"
                actionText="Voir le catalogue"
                onAction={handleNavigateToAnalyses}
              />
            )}
          </div>
        </div>

        {/* Quick Actions Section - ✨ All linked */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Calendar className={styles.sectionIcon} />
              Actions rapides
            </h3>
          </div>

          <div className={styles.quickActions}>
            <QuickActionCard
              icon={<Calendar />}
              title="Prendre RDV"
              description="Réserver un rendez-vous"
              color="blue"
              onClick={handleNavigateToAppointments}
            />
            <QuickActionCard
              icon={<FileText />}
              title="Mes analyses"
              description="Consulter les résultats"
              color="purple"
              onClick={handleNavigateToAnalyses}
            />
            <QuickActionCard
              icon={<DollarSign />}
              title="Payer une facture"
              description="Régler mes factures"
              color="green"
              onClick={handleNavigateToInvoices}
            />
            <QuickActionCard
              icon={<Activity />}
              title="Mon profil"
              description="Mettre à jour mes infos"
              color="orange"
              onClick={handleNavigateToProfile}
            />
          </div>
        </div>
      </div>

      {/* Health Summary - Full Width */}
      {stats.healthSummary && (
        <div className={styles.healthSummary}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              <Activity className={styles.sectionIcon} />
              Résumé de santé
            </h3>
          </div>
          <div className={styles.healthContent}>
            <p className={styles.healthText}>
              Tous vos indicateurs de santé sont normaux. Continuez vos bonnes
              habitudes!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// StatCard Component - ✨ Now clickable
const StatCard = ({ icon, title, value, subtitle, color, trend, onClick }) => (
  <div
    className={`${styles.statCard} ${styles[`statCard--${color}`]}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === "Enter" && onClick?.()}
  >
    <div className={styles.statCardHeader}>
      <div
        className={`${styles.statIconWrapper} ${
          styles[`statIconWrapper--${color}`]
        }`}
      >
        {icon}
      </div>
      <span className={styles.statTrend}>{trend}</span>
    </div>
    <div className={styles.statCardBody}>
      <p className={styles.statTitle}>{title}</p>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statSubtitle}>{subtitle}</p>
    </div>
    <div
      className={`${styles.statCardFooter} ${
        styles[`statCardFooter--${color}`]
      }`}
    />
  </div>
);

// AnalysisItem Component - ✨ Now clickable
const AnalysisItem = ({ analysis, index, onClick }) => (
  <div
    className={styles.analysisItem}
    style={{ animationDelay: `${index * 0.1}s` }}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => e.key === "Enter" && onClick?.()}
  >
    <div className={styles.analysisContent}>
      <div className={styles.analysisMain}>
        {analysis.isLegacy && (
          <span className={styles.legacyBadge} title="Ancienne analyse">
            📜 Legacy
          </span>
        )}
        <p className={styles.analysisName}>
          {analysis.analysisType?.name || "Analyse"}
        </p>
      </div>
      <div className={styles.analysisDetails}>
        <span className={styles.analysisDate}>
          <Clock className={styles.analysisDetailIcon} />
          {new Date(analysis.requestDate).toLocaleDateString("fr-FR")}
        </span>
        <span className={styles.analysisPrice}>
          <DollarSign className={styles.analysisDetailIcon} />
          {analysis.price} MAD
        </span>
      </div>
    </div>
    <StatusBadge status={analysis.status} />
  </div>
);

// StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: "En attente", color: "yellow" },
    sample_collected: { label: "Échantillon collecté", color: "blue" },
    in_progress: { label: "En cours", color: "blue" },
    completed: { label: "Terminée", color: "green" },
    validated: { label: "Validée", color: "green" },
    delivered: { label: "Livrée", color: "purple" },
  };

  const config = statusConfig[status] || { label: status, color: "gray" };

  return (
    <span
      className={`${styles.statusBadge} ${
        styles[`statusBadge--${config.color}`]
      }`}
    >
      {config.label}
    </span>
  );
};

// QuickActionCard Component - ✨ Now functional
const QuickActionCard = ({ icon, title, description, color, onClick }) => (
  <button
    className={`${styles.quickActionCard} ${
      styles[`quickActionCard--${color}`]
    }`}
    onClick={onClick}
    type="button"
  >
    <div
      className={`${styles.quickActionIcon} ${
        styles[`quickActionIcon--${color}`]
      }`}
    >
      {icon}
    </div>
    <div className={styles.quickActionContent}>
      <p className={styles.quickActionTitle}>{title}</p>
      <p className={styles.quickActionDescription}>{description}</p>
    </div>
  </button>
);

// EmptyState Component - ✨ With action
const EmptyState = ({ icon, message, description, actionText, onAction }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIconWrapper}>{icon}</div>
    <p className={styles.emptyMessage}>{message}</p>
    <p className={styles.emptyDescription}>{description}</p>
    {actionText && onAction && (
      <button className={styles.emptyActionButton} onClick={onAction}>
        {actionText}
      </button>
    )}
  </div>
);

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}>
      <div className={styles.spinnerInner} />
    </div>
    <p className={styles.loadingText}>Chargement de vos données...</p>
  </div>
);

// ErrorMessage Component
const ErrorMessage = ({ message, onRetry }) => (
  <div className={styles.errorContainer}>
    <div className={styles.errorIcon}>
      <AlertCircle />
    </div>
    <p className={styles.errorMessage}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className={styles.retryButton}>
        Réessayer
      </button>
    )}
  </div>
);

export default DashboardView;
