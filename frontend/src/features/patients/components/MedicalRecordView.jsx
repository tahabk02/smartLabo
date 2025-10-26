// src/features/patients/components/MedicalRecordView.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FileText,
  Heart,
  Activity,
  AlertCircle,
  Pill,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  User,
  Phone,
  Droplet,
  Clock,
  Shield,
  TestTube,
  Receipt,
  ChevronRight,
  History,
} from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./MedicalRecordView.module.css";

const MedicalRecordView = ({ onNavigate }) => {
  const { user } = useSelector((state) => state.auth);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dossier");
  const [error, setError] = useState(null);

  // Tabs configuration
  const tabs = useMemo(
    () => [
      { id: "dossier", label: "Dossier Médical", icon: "📋" },
      { id: "analyses", label: "Historique Analyses", icon: "🧪" },
      { id: "ordonnances", label: "Ordonnances", icon: "💊" },
      { id: "facturation", label: "Historique Factures", icon: "💰" },
    ],
    []
  );

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientApi.getMedicalRecord();
      setMedicalRecord(data);
    } catch (error) {
      console.error("Error loading medical record:", error);
      setError("Impossible de charger le dossier médical");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleNavigateToAnalyses = () => {
    if (onNavigate) {
      onNavigate("analyses");
    }
  };

  const handleNavigateToInvoices = () => {
    if (onNavigate) {
      onNavigate("invoices");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadMedicalRecord} />;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className={styles.title}>Mon Dossier Médical</h1>
            <p className={styles.subtitle}>
              Consultez l'ensemble de vos informations médicales
            </p>
          </div>
        </div>
        <button className={styles.downloadButton}>
          <Download className="w-4 h-4" />
          Télécharger PDF
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className={styles.tabs} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${
              activeTab === tab.id ? styles.active : ""
            }`}
            onClick={() => handleTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
          >
            <span className={styles.tabIcon} aria-hidden="true">
              {tab.icon}
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "dossier" && (
          <DossierMedicalTab medicalRecord={medicalRecord} user={user} />
        )}
        {activeTab === "analyses" && (
          <AnalysisHistoryTab onNavigate={handleNavigateToAnalyses} />
        )}
        {activeTab === "ordonnances" && (
          <OrdonnancesTab medicalRecord={medicalRecord} />
        )}
        {activeTab === "facturation" && (
          <FacturationTab onNavigate={handleNavigateToInvoices} />
        )}
      </div>
    </div>
  );
};

// ========== TAB 1: Dossier Médical ==========
const DossierMedicalTab = ({ medicalRecord, user }) => {
  return (
    <div className={styles.dossierTab}>
      {/* Patient Info Card */}
      <div className={styles.infoCard}>
        <h3 className={styles.cardTitle}>
          <User className="w-5 h-5" />
          Informations Personnelles
        </h3>
        <div className={styles.infoGrid}>
          <InfoItem
            icon={<User />}
            label="Nom complet"
            value={user?.name || "Non renseigné"}
          />
          <InfoItem
            icon={<Calendar />}
            label="Date de naissance"
            value={
              medicalRecord?.dateNaissance
                ? new Date(medicalRecord.dateNaissance).toLocaleDateString(
                    "fr-FR"
                  )
                : "Non renseignée"
            }
          />
          <InfoItem
            icon={<Phone />}
            label="Téléphone"
            value={medicalRecord?.telephone || "Non renseigné"}
          />
          <InfoItem
            icon={<Droplet />}
            label="Groupe sanguin"
            value={medicalRecord?.groupeSanguin || "Non renseigné"}
          />
        </div>
      </div>

      {/* Medical Info Card */}
      <div className={styles.infoCard}>
        <h3 className={styles.cardTitle}>
          <Heart className="w-5 h-5" />
          Informations Médicales
        </h3>

        {/* Allergies */}
        <div className={styles.medicalSection}>
          <h4 className={styles.sectionTitle}>
            <AlertCircle className="w-4 h-4 text-red-500" />
            Allergies
          </h4>
          {medicalRecord?.allergies && medicalRecord.allergies.length > 0 ? (
            <div className={styles.badgeList}>
              {medicalRecord.allergies.map((allergy, index) => (
                <span key={index} className={styles.allergyBadge}>
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Aucune allergie connue</p>
          )}
        </div>

        {/* Maladies Chroniques */}
        <div className={styles.medicalSection}>
          <h4 className={styles.sectionTitle}>
            <Activity className="w-4 h-4 text-orange-500" />
            Maladies Chroniques
          </h4>
          {medicalRecord?.maladiesChroniques &&
          medicalRecord.maladiesChroniques.length > 0 ? (
            <div className={styles.badgeList}>
              {medicalRecord.maladiesChroniques.map((maladie, index) => (
                <span key={index} className={styles.diseaseBadge}>
                  {maladie}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Aucune maladie chronique</p>
          )}
        </div>

        {/* Traitements en cours */}
        <div className={styles.medicalSection}>
          <h4 className={styles.sectionTitle}>
            <Pill className="w-4 h-4 text-blue-500" />
            Traitements en cours
          </h4>
          {medicalRecord?.traitements &&
          medicalRecord.traitements.length > 0 ? (
            <div className={styles.treatmentList}>
              {medicalRecord.traitements.map((traitement, index) => (
                <div key={index} className={styles.treatmentItem}>
                  <span className={styles.treatmentName}>{traitement.nom}</span>
                  <span className={styles.treatmentDosage}>
                    {traitement.dosage}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyText}>Aucun traitement en cours</p>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className={styles.infoCard}>
        <h3 className={styles.cardTitle}>
          <Shield className="w-5 h-5" />
          Contact d'Urgence
        </h3>
        <div className={styles.infoGrid}>
          <InfoItem
            icon={<User />}
            label="Nom"
            value={medicalRecord?.contactUrgence?.nom || "Non renseigné"}
          />
          <InfoItem
            icon={<Phone />}
            label="Téléphone"
            value={medicalRecord?.contactUrgence?.telephone || "Non renseigné"}
          />
          <InfoItem
            icon={<Heart />}
            label="Relation"
            value={medicalRecord?.contactUrgence?.relation || "Non renseignée"}
          />
        </div>
      </div>
    </div>
  );
};

// ========== TAB 2: Historique Analyses ==========
const AnalysisHistoryTab = ({ onNavigate }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await patientApi.getAnalyses();
      setAnalyses(data.data || []);
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    if (filter === "all") return true;
    return analysis.status === filter;
  });

  return (
    <div className={styles.historyTab}>
      {/* Header with actions */}
      <div className={styles.historyHeader}>
        <div className={styles.historyStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{analyses.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {analyses.filter((a) => a.status === "completed").length}
            </span>
            <span className={styles.statLabel}>Terminées</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {analyses.filter((a) => a.status === "pending").length}
            </span>
            <span className={styles.statLabel}>En attente</span>
          </div>
        </div>

        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${
              filter === "all" ? styles.filterActive : ""
            }`}
            onClick={() => setFilter("all")}
          >
            Toutes
          </button>
          <button
            className={`${styles.filterButton} ${
              filter === "completed" ? styles.filterActive : ""
            }`}
            onClick={() => setFilter("completed")}
          >
            Terminées
          </button>
          <button
            className={`${styles.filterButton} ${
              filter === "pending" ? styles.filterActive : ""
            }`}
            onClick={() => setFilter("pending")}
          >
            En attente
          </button>
        </div>
      </div>

      {/* Analyses Timeline */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredAnalyses.length > 0 ? (
        <div className={styles.timeline}>
          {filteredAnalyses.map((analysis, index) => (
            <AnalysisTimelineItem
              key={analysis._id}
              analysis={analysis}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<TestTube />}
          message="Aucune analyse trouvée"
          description="Vos analyses apparaîtront ici"
          actionText="Voir le catalogue"
          onAction={onNavigate}
        />
      )}

      {/* Action Button */}
      <div className={styles.tabActions}>
        <button className={styles.primaryButton} onClick={onNavigate}>
          <TestTube className="w-4 h-4" />
          Voir toutes mes analyses
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ========== TAB 3: Ordonnances ==========
const OrdonnancesTab = ({ medicalRecord }) => {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrdonnances();
  }, []);

  const loadOrdonnances = async () => {
    try {
      const data = await patientApi.getOrdonnances();
      setOrdonnances(data || []);
    } catch (error) {
      console.error("Error loading ordonnances:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.ordonnancesTab}>
      <div className={styles.ordonnancesHeader}>
        <h3>Mes Ordonnances</h3>
        <span className={styles.count}>{ordonnances.length} ordonnance(s)</span>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : ordonnances.length > 0 ? (
        <div className={styles.ordonnancesList}>
          {ordonnances.map((ordonnance, index) => (
            <OrdonnanceCard key={index} ordonnance={ordonnance} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Pill />}
          message="Aucune ordonnance"
          description="Vos ordonnances apparaîtront ici"
        />
      )}
    </div>
  );
};

// ========== TAB 4: Historique Facturation ==========
const FacturationTab = ({ onNavigate }) => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 });

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    try {
      const data = await patientApi.getInvoices();
      setFactures(data || []);

      // Calculate stats
      const total = data.reduce((sum, f) => sum + (f.montantTotal || 0), 0);
      const paid = data
        .filter((f) => f.statut === "Payée")
        .reduce((sum, f) => sum + f.montantTotal, 0);
      const unpaid = total - paid;

      setStats({ total, paid, unpaid });
    } catch (error) {
      console.error("Error loading factures:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.facturationTab}>
      {/* Financial Summary */}
      <div className={styles.financialSummary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Receipt className="w-6 h-6" />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total Dépensé</span>
            <span className={styles.summaryValue}>{stats.total} MAD</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: "#d1fae5" }}>
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Payé</span>
            <span className={styles.summaryValue} style={{ color: "#10b981" }}>
              {stats.paid} MAD
            </span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: "#fee2e2" }}>
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>À Payer</span>
            <span className={styles.summaryValue} style={{ color: "#ef4444" }}>
              {stats.unpaid} MAD
            </span>
          </div>
        </div>
      </div>

      {/* Factures List */}
      {loading ? (
        <LoadingSpinner />
      ) : factures.length > 0 ? (
        <div className={styles.facturesList}>
          {factures.map((facture, index) => (
            <FactureCard key={index} facture={facture} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Receipt />}
          message="Aucune facture"
          description="Vos factures apparaîtront ici"
        />
      )}

      {/* Action Button */}
      <div className={styles.tabActions}>
        <button className={styles.primaryButton} onClick={onNavigate}>
          <Receipt className="w-4 h-4" />
          Voir toutes mes factures
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ========== COMPONENTS ==========

const InfoItem = ({ icon, label, value }) => (
  <div className={styles.infoItem}>
    <div className={styles.infoIcon}>{icon}</div>
    <div className={styles.infoContent}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  </div>
);

const AnalysisTimelineItem = ({ analysis, index }) => (
  <div
    className={styles.timelineItem}
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className={styles.timelineMarker}>
      <TestTube className="w-4 h-4" />
    </div>
    <div className={styles.timelineContent}>
      <div className={styles.timelineHeader}>
        <h4>{analysis.analysisType?.name || "Analyse"}</h4>
        <span className={`${styles.timelineStatus} ${styles[analysis.status]}`}>
          {getStatusLabel(analysis.status)}
        </span>
      </div>
      <p className={styles.timelineDate}>
        <Clock className="w-4 h-4" />
        {new Date(analysis.requestDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <p className={styles.timelinePrice}>{analysis.price} MAD</p>
    </div>
  </div>
);

const OrdonnanceCard = ({ ordonnance }) => (
  <div className={styles.ordonnanceCard}>
    <div className={styles.ordonnanceHeader}>
      <Pill className="w-5 h-5" />
      <span className={styles.ordonnanceDate}>
        {new Date(ordonnance.date).toLocaleDateString("fr-FR")}
      </span>
    </div>
    <div className={styles.ordonnanceBody}>
      <p className={styles.ordonnanceDoctor}>Dr. {ordonnance.medecin}</p>
      <div className={styles.medicamentsList}>
        {ordonnance.medicaments?.map((med, i) => (
          <span key={i} className={styles.medicamentBadge}>
            {med}
          </span>
        ))}
      </div>
    </div>
    <button className={styles.ordonnanceAction}>
      <Eye className="w-4 h-4" />
      Voir
    </button>
  </div>
);

const FactureCard = ({ facture }) => (
  <div className={styles.factureCard}>
    <div className={styles.factureHeader}>
      <div>
        <span className={styles.factureNumber}>{facture.numeroFacture}</span>
        <span className={styles.factureDate}>
          {new Date(facture.dateFacture).toLocaleDateString("fr-FR")}
        </span>
      </div>
      <span className={`${styles.factureStatus} ${styles[facture.statut]}`}>
        {facture.statut}
      </span>
    </div>
    <div className={styles.factureBody}>
      <span className={styles.factureMontant}>{facture.montantTotal} MAD</span>
      <div className={styles.factureActions}>
        <button className={styles.iconButton}>
          <Eye className="w-4 h-4" />
        </button>
        <button className={styles.iconButton}>
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Chargement...</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className={styles.errorContainer}>
    <AlertCircle className="w-12 h-12 text-red-500" />
    <p className={styles.errorMessage}>{message}</p>
    {onRetry && (
      <button onClick={onRetry} className={styles.retryButton}>
        Réessayer
      </button>
    )}
  </div>
);

const EmptyState = ({ icon, message, description, actionText, onAction }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>{icon}</div>
    <p className={styles.emptyMessage}>{message}</p>
    <p className={styles.emptyDescription}>{description}</p>
    {actionText && onAction && (
      <button className={styles.emptyButton} onClick={onAction}>
        {actionText}
      </button>
    )}
  </div>
);

// Helper functions
const getStatusLabel = (status) => {
  const labels = {
    pending: "En attente",
    in_progress: "En cours",
    completed: "Terminée",
    validated: "Validée",
    delivered: "Livrée",
  };
  return labels[status] || status;
};

export default MedicalRecordView;
