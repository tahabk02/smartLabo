// frontend/src/features/patients/components/AnalysesView.jsx
// VERSION COMPLÈTE avec mise à jour automatique de l'historique

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Filter,
  Calendar,
  Plus,
  Minus,
  TestTube,
  Clock,
  DollarSign,
  Loader,
  X,
  History,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  TrendingUp,
  Activity,
  Package,
} from "lucide-react";
import styles from "./AnalysesView.module.css";

const AnalysesView = () => {
  const { user } = useSelector((state) => state.auth);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("catalogue");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchAnalyses();
    fetchAnalysisHistory();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setError(null);
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token non trouvé - Veuillez vous reconnecter");
      }

      const response = await fetch("http://localhost:5000/api/analyses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const responseText = await response.text();

        if (
          responseText.trim().startsWith("<!DOCTYPE") ||
          responseText.includes("<html>")
        ) {
          throw new Error(
            "Le serveur renvoie une page HTML. Vérifiez que la route /api/analyses existe."
          );
        }

        const data = JSON.parse(responseText);

        if (data && Array.isArray(data)) {
          const validAnalyses = data.filter(
            (analysis) =>
              analysis &&
              analysis._id &&
              analysis.name &&
              analysis.category &&
              analysis.price !== undefined &&
              analysis.isActive !== false
          );

          if (validAnalyses.length > 0) {
            setAnalyses(validAnalyses);
            const uniqueCategories = [
              ...new Set(validAnalyses.map((analysis) => analysis.category)),
            ];
            setCategories(uniqueCategories);
          } else {
            throw new Error("Aucune analyse valide trouvée.");
          }
        } else {
          throw new Error("Format de données invalide");
        }
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur chargement analyses:", error);
      setError(error.message);
      setAnalyses([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = localStorage.getItem("token");

      // Récupérer l'historique depuis les rendez-vous
      const response = await fetch(
        "http://localhost:5000/api/patient/appointments",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const appointments = await response.json();
        console.log("📊 Rendez-vous reçus:", appointments); // DEBUG

        // Transformer les rendez-vous en historique d'analyses
        const history = [];

        if (Array.isArray(appointments)) {
          appointments.forEach((appointment) => {
            console.log("🔍 Traitement rendez-vous:", appointment); // DEBUG

            // Vérifier si analyses existe et est un tableau
            if (
              appointment.analyses &&
              Array.isArray(appointment.analyses) &&
              appointment.analyses.length > 0
            ) {
              appointment.analyses.forEach((analysis) => {
                // Si l'analyse est juste un ID (référence populate non faite)
                if (typeof analysis === "string") {
                  console.warn("⚠️ Analyse non peuplée (juste ID):", analysis);
                  return; // Skip cette analyse
                }

                // Si c'est un objet avec des données
                history.push({
                  _id: `${appointment._id}-${
                    analysis._id || analysis.name || Math.random()
                  }`,
                  appointmentId: appointment._id,
                  analysisId: analysis._id,
                  analysisName: analysis.name || "Analyse sans nom",
                  analysisCode: analysis.code || "N/A",
                  category: analysis.category || "Non catégorisée",
                  price: analysis.price || 0,
                  date: appointment.date,
                  status: appointment.status || "pending",
                  result: analysis.result || null,
                  resultDate: analysis.resultDate || null,
                  notes: appointment.notes || analysis.notes || "",
                  sampleType: analysis.sampleType || null,
                  turnaroundTime: analysis.turnaroundTime || null,
                });
              });
            } else {
              console.warn(
                "⚠️ Rendez-vous sans analyses ou analyses non-array:",
                appointment
              );
            }
          });
        } else {
          console.error(
            "❌ Les rendez-vous ne sont pas un tableau:",
            appointments
          );
        }

        // Trier par date (plus récent en premier)
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log("✅ Historique construit:", history); // DEBUG
        setAnalysisHistory(history);
      } else {
        console.error("❌ Erreur HTTP:", response.status);
      }
    } catch (error) {
      console.error("❌ Erreur chargement historique:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter((analysis) => {
    if (!analysis) return false;

    const matchesSearch =
      analysis.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || analysis.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleAnalysisSelection = (analysis) => {
    const isSelected = selectedAnalyses.some(
      (item) => item._id === analysis._id
    );
    if (isSelected) {
      setSelectedAnalyses(
        selectedAnalyses.filter((item) => item._id !== analysis._id)
      );
    } else {
      setSelectedAnalyses([...selectedAnalyses, analysis]);
    }
  };

  const totalPrice = selectedAnalyses.reduce(
    (total, analysis) => total + (analysis.price || 0),
    0
  );

  const handleTakeAppointment = () => {
    if (selectedAnalyses.length === 0) {
      alert("Veuillez sélectionner au moins une analyse");
      return;
    }
    setShowAppointmentModal(true);
  };

  const confirmAppointment = async (dateTime) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/rendezvous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: dateTime,
          analyses: selectedAnalyses.map((a) => a._id),
          notes: `Rendez-vous créé depuis le catalogue. Analyses: ${selectedAnalyses
            .map((a) => a.name)
            .join(", ")}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Afficher un message de succès
        setSuccessMessage({
          type: "success",
          title: "Rendez-vous créé avec succès !",
          analyses: selectedAnalyses,
          date: dateTime,
          total: totalPrice,
          invoiceNumber: result.invoice?.invoiceNumber,
        });

        setSelectedAnalyses([]);
        setShowAppointmentModal(false);

        // Rafraîchir l'historique
        await fetchAnalysisHistory();

        // Basculer vers l'historique après 3 secondes
        setTimeout(() => {
          setActiveTab("historique");
          setSuccessMessage(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`❌ Erreur: ${errorData.message || "Erreur serveur"}`);
      }
    } catch (error) {
      console.error("Erreur création rendez-vous:", error);
      alert("❌ Erreur de connexion: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchAnalyses();
    fetchAnalysisHistory();
  };

  // FONCTION DE TEST - À RETIRER EN PRODUCTION
  const testWithMockData = () => {
    const mockHistory = [
      {
        _id: "mock-1",
        appointmentId: "rdv-1",
        analysisId: "ana-1",
        analysisName: "Test de Glycémie",
        analysisCode: "GLY-001",
        category: "Biochimie",
        price: 150,
        date: new Date().toISOString(),
        status: "completed",
        result: "Résultat normal - 0.9 g/L",
        resultDate: new Date().toISOString(),
        notes: "Test de données mockées",
        sampleType: "Sang",
        turnaroundTime: "24h",
      },
      {
        _id: "mock-2",
        appointmentId: "rdv-1",
        analysisId: "ana-2",
        analysisName: "Numération Formule Sanguine",
        analysisCode: "NFS-001",
        category: "Hématologie",
        price: 200,
        date: new Date().toISOString(),
        status: "pending",
        result: null,
        resultDate: null,
        notes: "En attente des résultats",
        sampleType: "Sang",
        turnaroundTime: "48h",
      },
    ];

    console.log("🧪 Test avec données mockées:", mockHistory);
    setAnalysisHistory(mockHistory);
  };

  if (loading && !successMessage) {
    return (
      <div className={styles.loading}>
        <Loader className="w-8 h-8 animate-spin" />
        <p>Chargement des analyses...</p>
      </div>
    );
  }

  return (
    <div className={styles.analysesContainer}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              {activeTab === "catalogue" ? (
                <TestTube className={styles.headerIcon} />
              ) : (
                <History className={styles.headerIcon} />
              )}
            </div>
            <div>
              <h1 className={styles.title}>
                {activeTab === "catalogue"
                  ? "Catalogue des Analyses"
                  : "Historique de Mes Analyses"}
              </h1>
              <p className={styles.subtitle}>
                {activeTab === "catalogue"
                  ? "Sélectionnez les analyses dont vous avez besoin et prenez rendez-vous"
                  : "Consultez l'historique de vos analyses et résultats"}
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className={styles.statsGrid}>
          <StatCard
            icon={Package}
            value={analyses.length}
            label="Analyses disponibles"
            color="#3b82f6"
          />
          <StatCard
            icon={Activity}
            value={analysisHistory.length}
            label="Analyses effectuées"
            color="#10b981"
          />
          <StatCard
            icon={CheckCircle}
            value={
              analysisHistory.filter((h) => h.status === "completed").length
            }
            label="Résultats disponibles"
            color="#8b5cf6"
          />
          <StatCard
            icon={TrendingUp}
            value={selectedAnalyses.length}
            label="Sélection actuelle"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className={styles.tabsNavigation}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "catalogue" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("catalogue")}
        >
          <TestTube className="w-5 h-5" />
          Catalogue des Analyses
          <span className={styles.tabBadge}>{analyses.length}</span>
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "historique" ? styles.tabActive : ""
          }`}
          onClick={() => setActiveTab("historique")}
        >
          <History className="w-5 h-5" />
          Mon Historique
          {analysisHistory.length > 0 && (
            <span className={styles.tabBadge}>{analysisHistory.length}</span>
          )}
        </button>
      </div>

      {/* Notification de succès */}
      {successMessage && (
        <div className={styles.successNotification}>
          <div className={styles.successIcon}>
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className={styles.successContent}>
            <h3>{successMessage.title}</h3>
            <p>
              📅{" "}
              {new Date(successMessage.date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              📋 {successMessage.analyses.length} analyses • 💰{" "}
              {successMessage.total} MAD
            </p>
            {successMessage.invoiceNumber && (
              <p className={styles.invoiceInfo}>
                📄 Facture N° {successMessage.invoiceNumber}
              </p>
            )}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className={styles.closeNotification}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className={styles.errorTitle}>Erreur de connexion</p>
            <p className={styles.errorMessage}>{error}</p>
          </div>
          <button onClick={handleRetry} className={styles.retryButton}>
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu selon l'onglet actif */}
      {activeTab === "catalogue" ? (
        <CatalogueContent
          analyses={analyses}
          filteredAnalyses={filteredAnalyses}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          selectedAnalyses={selectedAnalyses}
          toggleAnalysisSelection={toggleAnalysisSelection}
          totalPrice={totalPrice}
          handleTakeAppointment={handleTakeAppointment}
          error={error}
          showAppointmentModal={showAppointmentModal}
          setShowAppointmentModal={setShowAppointmentModal}
          confirmAppointment={confirmAppointment}
          handleRetry={handleRetry}
        />
      ) : (
        <HistoryContent
          analysisHistory={analysisHistory}
          error={error}
          loading={historyLoading}
          onRefresh={fetchAnalysisHistory}
        />
      )}
    </div>
  );
};

// Composant Carte de Statistique
const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ backgroundColor: color }}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className={styles.statContent}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  </div>
);

// Composant Contenu Catalogue
const CatalogueContent = ({
  analyses,
  filteredAnalyses,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  selectedAnalyses,
  toggleAnalysisSelection,
  totalPrice,
  handleTakeAppointment,
  error,
  showAppointmentModal,
  setShowAppointmentModal,
  confirmAppointment,
  handleRetry,
}) => {
  return (
    <div className={styles.contentWrapper}>
      <div className={styles.mainContent}>
        {!error && analyses.length > 0 && (
          <>
            {/* Filtres */}
            <div className={styles.filtersSection}>
              <div className={styles.searchBox}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Rechercher une analyse par nom, code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className={styles.clearSearch}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className={styles.categoryFilter}>
                <Filter className={styles.filterIcon} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.categorySelect}
                >
                  <option value="all">Toutes ({analyses.length})</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category} (
                      {analyses.filter((a) => a.category === category).length})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grille des analyses */}
            <div className={styles.analysesGrid}>
              {filteredAnalyses.map((analysis) => {
                const isSelected = selectedAnalyses.some(
                  (item) => item._id === analysis._id
                );

                return (
                  <div
                    key={analysis._id}
                    className={`${styles.analysisCard} ${
                      isSelected ? styles.analysisCardSelected : ""
                    }`}
                  >
                    {isSelected && (
                      <div className={styles.selectedBadge}>
                        <CheckCircle className="w-4 h-4" />
                        Sélectionnée
                      </div>
                    )}

                    <div className={styles.analysisHeader}>
                      <h3 className={styles.analysisName}>{analysis.name}</h3>
                      <span className={styles.analysisCode}>
                        {analysis.code}
                      </span>
                    </div>

                    {analysis.description && (
                      <p className={styles.analysisDescription}>
                        {analysis.description}
                      </p>
                    )}

                    <div className={styles.analysisDetails}>
                      <div className={styles.detailItem}>
                        <Clock className="w-4 h-4" />
                        <span>{analysis.turnaroundTime || "24-48h"}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <DollarSign className="w-4 h-4" />
                        <span className={styles.analysisPrice}>
                          {analysis.price || 0} MAD
                        </span>
                      </div>
                    </div>

                    <div className={styles.analysisFooter}>
                      <span className={styles.categoryBadge}>
                        {analysis.category}
                      </span>
                      <button
                        onClick={() => toggleAnalysisSelection(analysis)}
                        className={`${styles.selectButton} ${
                          isSelected ? styles.selected : ""
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Minus className="w-4 h-4" />
                            Retirer
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Ajouter
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* États vides */}
        {!error && filteredAnalyses.length === 0 && analyses.length > 0 && (
          <div className={styles.noResults}>
            <TestTube className="w-16 h-16" />
            <h3>Aucune analyse trouvée</h3>
            <p>Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className={styles.resetButton}
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {!error && analyses.length === 0 && (
          <div className={styles.noData}>
            <TestTube className="w-20 h-20" />
            <h3>Aucune analyse disponible</h3>
            <p>Le catalogue est actuellement vide</p>
            <button onClick={handleRetry} className={styles.retryButton}>
              Actualiser
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Panier */}
      {!error && analyses.length > 0 && (
        <div className={styles.cartSidebar}>
          <div className={styles.cartHeader}>
            <h3>Analyses Sélectionnées</h3>
            <span className={styles.cartCount}>{selectedAnalyses.length}</span>
          </div>

          <div className={styles.cartItems}>
            {selectedAnalyses.length > 0 ? (
              selectedAnalyses.map((analysis) => (
                <div key={analysis._id} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartItemName}>{analysis.name}</span>
                    <span className={styles.cartItemCode}>{analysis.code}</span>
                    <span className={styles.cartItemPrice}>
                      {analysis.price || 0} MAD
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAnalysisSelection(analysis)}
                    className={styles.removeButton}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.emptyCart}>
                <TestTube className="w-12 h-12" />
                <p>Panier vide</p>
                <p className={styles.emptyCartHint}>
                  Sélectionnez des analyses
                </p>
              </div>
            )}
          </div>

          {selectedAnalyses.length > 0 && (
            <div className={styles.cartFooter}>
              <div className={styles.cartSummary}>
                <div className={styles.summaryRow}>
                  <span>Nombre d'analyses:</span>
                  <strong>{selectedAnalyses.length}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Total:</span>
                  <strong className={styles.totalPrice}>
                    {totalPrice} MAD
                  </strong>
                </div>
              </div>
              <button
                onClick={handleTakeAppointment}
                className={styles.appointmentButton}
              >
                <Calendar className="w-5 h-5" />
                Prendre Rendez-vous
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de prise de rendez-vous */}
      {showAppointmentModal && (
        <AppointmentModal
          selectedAnalyses={selectedAnalyses}
          totalPrice={totalPrice}
          onConfirm={confirmAppointment}
          onCancel={() => setShowAppointmentModal(false)}
        />
      )}
    </div>
  );
};

// Composant Contenu Historique
const HistoryContent = ({ analysisHistory, error, loading, onRefresh }) => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) {
    return (
      <div className={styles.historyContainer}>
        <div className={styles.loading}>
          <Loader className="w-8 h-8 animate-spin" />
          <p>Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.historyContainer}>
        <div className={styles.errorState}>
          <AlertCircle className="w-16 h-16" />
          <h3>Impossible de charger l'historique</h3>
          <p>{error}</p>
          <button onClick={onRefresh} className={styles.retryButton}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Filtrage de l'historique
  const filteredHistory = analysisHistory.filter((item) => {
    const matchesFilter =
      filter === "all" ||
      item.status === filter ||
      (filter === "withResults" && item.result);

    const matchesSearch =
      item.analysisName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.analysisCode?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Statistiques
  const stats = {
    total: analysisHistory.length,
    completed: analysisHistory.filter((h) => h.status === "completed").length,
    pending: analysisHistory.filter((h) => h.status === "pending").length,
    withResults: analysisHistory.filter((h) => h.result).length,
  };

  return (
    <div className={styles.historyContainer}>
      {analysisHistory.length === 0 ? (
        <div className={styles.emptyHistory}>
          <History className="w-20 h-20" />
          <h3>Aucun historique</h3>
          <p>Vous n'avez pas encore effectué d'analyses</p>
          <p className={styles.emptyHistoryHint}>
            Rendez-vous dans le catalogue pour sélectionner vos premières
            analyses
          </p>
        </div>
      ) : (
        <>
          {/* Filtres historique */}
          <div className={styles.historyFilters}>
            <div className={styles.searchBox}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className={styles.clearSearch}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className={styles.statusFilters}>
              <button
                className={`${styles.filterBtn} ${
                  filter === "all" ? styles.filterActive : ""
                }`}
                onClick={() => setFilter("all")}
              >
                Toutes ({stats.total})
              </button>
              <button
                className={`${styles.filterBtn} ${
                  filter === "completed" ? styles.filterActive : ""
                }`}
                onClick={() => setFilter("completed")}
              >
                <CheckCircle className="w-4 h-4" />
                Terminées ({stats.completed})
              </button>
              <button
                className={`${styles.filterBtn} ${
                  filter === "pending" ? styles.filterActive : ""
                }`}
                onClick={() => setFilter("pending")}
              >
                <Clock className="w-4 h-4" />
                En attente ({stats.pending})
              </button>
              <button
                className={`${styles.filterBtn} ${
                  filter === "withResults" ? styles.filterActive : ""
                }`}
                onClick={() => setFilter("withResults")}
              >
                <FileText className="w-4 h-4" />
                Avec résultats ({stats.withResults})
              </button>
            </div>
          </div>

          {/* Liste de l'historique */}
          <div className={styles.historyList}>
            {filteredHistory.length === 0 ? (
              <div className={styles.noResults}>
                <Search className="w-16 h-16" />
                <h3>Aucun résultat</h3>
                <p>Aucune analyse ne correspond à vos critères</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item._id} className={styles.historyItem}>
                  <div className={styles.historyItemHeader}>
                    <div className={styles.historyItemTitle}>
                      <h4>{item.analysisName}</h4>
                      <span className={styles.historyCode}>
                        {item.analysisCode}
                      </span>
                    </div>
                    <span
                      className={`${styles.statusBadge} ${styles[item.status]}`}
                    >
                      {item.status === "completed"
                        ? "Terminée"
                        : item.status === "pending"
                        ? "En attente"
                        : item.status === "confirmed"
                        ? "Confirmée"
                        : item.status}
                    </span>
                  </div>

                  <div className={styles.historyItemDetails}>
                    <div className={styles.detailRow}>
                      <div className={styles.detail}>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(item.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className={styles.detail}>
                        <TestTube className="w-4 h-4" />
                        <span>{item.category}</span>
                      </div>
                      <div className={styles.detail}>
                        <DollarSign className="w-4 h-4" />
                        <span>{item.price} MAD</span>
                      </div>
                    </div>

                    {item.sampleType && (
                      <div className={styles.detail}>
                        <Package className="w-4 h-4" />
                        <span>Échantillon: {item.sampleType}</span>
                      </div>
                    )}

                    {item.turnaroundTime && (
                      <div className={styles.detail}>
                        <Clock className="w-4 h-4" />
                        <span>Délai: {item.turnaroundTime}</span>
                      </div>
                    )}
                  </div>

                  {item.result && (
                    <div className={styles.resultSection}>
                      <div className={styles.resultHeader}>
                        <FileText className="w-4 h-4" />
                        <strong>Résultat disponible</strong>
                      </div>
                      <div className={styles.resultContent}>
                        <p>{item.result}</p>
                        {item.resultDate && (
                          <span className={styles.resultDate}>
                            Disponible le{" "}
                            {new Date(item.resultDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        )}
                      </div>
                      <button className={styles.viewResultButton}>
                        <Eye className="w-4 h-4" />
                        Voir le résultat complet
                      </button>
                    </div>
                  )}

                  {item.notes && (
                    <div className={styles.notesSection}>
                      <strong>Notes:</strong>
                      <p>{item.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Composant Modal de Rendez-vous
const AppointmentModal = ({
  selectedAnalyses,
  totalPrice,
  onConfirm,
  onCancel,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert("Veuillez sélectionner une date et une heure");
      return;
    }

    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    onConfirm(dateTime, notes);
  };

  // Générer les créneaux horaires (8h-18h, par tranches de 30min)
  const timeSlots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(timeString);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleSection}>
            <Calendar className="w-6 h-6" />
            <h2 className={styles.modalTitle}>Prendre un Rendez-vous</h2>
          </div>
          <button onClick={onCancel} className={styles.closeButton}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Liste des analyses sélectionnées */}
          <div className={styles.selectedAnalysesList}>
            <h4 className={styles.listTitle}>
              <TestTube className="w-5 h-5" />
              Analyses sélectionnées ({selectedAnalyses.length})
            </h4>
            <div className={styles.analysesList}>
              {selectedAnalyses.map((analysis, index) => (
                <div key={analysis._id} className={styles.modalAnalysisItem}>
                  <div className={styles.analysisItemLeft}>
                    <span className={styles.itemNumber}>{index + 1}</span>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{analysis.name}</span>
                      <span className={styles.itemCode}>{analysis.code}</span>
                    </div>
                  </div>
                  <span className={styles.itemPrice}>
                    {analysis.price || 0} MAD
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.modalTotal}>
              <span>Total:</span>
              <strong>{totalPrice} MAD</strong>
            </div>
          </div>

          {/* Formulaire de rendez-vous */}
          <form onSubmit={handleSubmit} className={styles.appointmentForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="date">
                  <Calendar className="w-4 h-4" />
                  Date du rendez-vous
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="time">
                  <Clock className="w-4 h-4" />
                  Heure du rendez-vous
                </label>
                <select
                  id="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className={styles.formSelect}
                >
                  <option value="">Sélectionnez une heure</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">
                <FileText className="w-4 h-4" />
                Notes supplémentaires (optionnel)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des informations supplémentaires (allergies, symptômes, etc.)"
                className={styles.formTextarea}
                rows={3}
              />
            </div>

            {/* Informations importantes */}
            <div className={styles.infoBox}>
              <AlertCircle className="w-5 h-5" />
              <div>
                <strong>Informations importantes:</strong>
                <ul>
                  <li>Présentez-vous 15 minutes avant votre rendez-vous</li>
                  <li>Apportez votre carte d'identité et votre carte vitale</li>
                  <li>Respectez les consignes de jeûne si nécessaire</li>
                  <li>Une confirmation vous sera envoyée par email</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={onCancel}
                className={styles.cancelButton}
              >
                Annuler
              </button>
              <button type="submit" className={styles.confirmButton}>
                <CheckCircle className="w-5 h-5" />
                Confirmer le Rendez-vous
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnalysesView;
