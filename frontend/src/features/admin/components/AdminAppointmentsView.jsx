// frontend/src/features/admin/components/AdminAppointmentsView.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Calendar,
  Clock,
  User,
  TestTube,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  Loader,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchAllAppointments,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  setFilters,
  selectFilteredAppointments,
  selectAppointmentsStats,
  selectAppointmentsLoading,
  selectAppointmentsError,
} from "../../appointments/appointmentsSlice";
import styles from "./AdminAppointmentsView.module.css";

const AdminAppointmentsView = () => {
  const dispatch = useDispatch();

  // Redux state
  const appointments = useSelector(selectFilteredAppointments);
  const stats = useSelector(selectAppointmentsStats);
  const loading = useSelector(selectAppointmentsLoading);
  const error = useSelector(selectAppointmentsError);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les rendez-vous au montage
  useEffect(() => {
    dispatch(fetchAllAppointments());
  }, [dispatch]);

  // Mettre à jour les filtres Redux
  useEffect(() => {
    dispatch(
      setFilters({
        search: searchTerm,
        status: statusFilter,
      })
    );
  }, [searchTerm, statusFilter, dispatch]);

  // Actions
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAllAppointments());
    setRefreshing(false);
  };

  const handleConfirm = async (appointmentId) => {
    if (window.confirm("Confirmer ce rendez-vous ?")) {
      await dispatch(confirmAppointment(appointmentId));
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Annuler ce rendez-vous ?")) {
      await dispatch(cancelAppointment(appointmentId));
    }
  };

  const handleComplete = async (appointmentId) => {
    if (window.confirm("Marquer ce rendez-vous comme terminé ?")) {
      await dispatch(completeAppointment(appointmentId));
    }
  };

  const toggleExpand = (appointmentId) => {
    setExpandedCard(expandedCard === appointmentId ? null : appointmentId);
  };

  if (loading && !refreshing) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
        <p>Chargement des rendez-vous...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <Calendar className="w-8 h-8" />
              Gestion des Rendez-vous
            </h1>
            <p className={styles.subtitle}>
              Gérez tous les rendez-vous des patients
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={styles.refreshButton}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        {/* Statistiques */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#3b82f6" }}
            >
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#f59e0b" }}
            >
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.pending}</div>
              <div className={styles.statLabel}>En Attente</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#10b981" }}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.confirmed}</div>
              <div className={styles.statLabel}>Confirmés</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ backgroundColor: "#8b5cf6" }}
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.completed}</div>
              <div className={styles.statLabel}>Terminés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.filtersSection}>
        {/* Recherche */}
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par patient, email, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filtre par statut */}
        <div className={styles.statusFilter}>
          <Filter className={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les statuts ({stats.total})</option>
            <option value="pending">En attente ({stats.pending})</option>
            <option value="confirmed">Confirmés ({stats.confirmed})</option>
            <option value="completed">Terminés ({stats.completed})</option>
            <option value="cancelled">Annulés ({stats.cancelled})</option>
          </select>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Liste des rendez-vous */}
      {appointments.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar className="w-20 h-20 text-gray-400" />
          <h3>Aucun rendez-vous trouvé</h3>
          <p>
            {searchTerm || statusFilter !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Il n'y a pas encore de rendez-vous"}
          </p>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              isExpanded={expandedCard === appointment._id}
              onToggleExpand={() => toggleExpand(appointment._id)}
              onConfirm={() => handleConfirm(appointment._id)}
              onCancel={() => handleCancel(appointment._id)}
              onComplete={() => handleComplete(appointment._id)}
              onViewDetails={() => setSelectedAppointment(appointment)}
            />
          ))}
        </div>
      )}

      {/* Modal de détails */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onConfirm={() => handleConfirm(selectedAppointment._id)}
          onCancel={() => handleCancel(selectedAppointment._id)}
          onComplete={() => handleComplete(selectedAppointment._id)}
        />
      )}
    </div>
  );
};

// Carte de rendez-vous
const AppointmentCard = ({
  appointment,
  isExpanded,
  onToggleExpand,
  onConfirm,
  onCancel,
  onComplete,
  onViewDetails,
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "En Attente",
        color: "#f59e0b",
        icon: Clock,
      },
      confirmed: {
        label: "Confirmé",
        color: "#10b981",
        icon: CheckCircle,
      },
      completed: {
        label: "Terminé",
        color: "#8b5cf6",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Annulé",
        color: "#ef4444",
        icon: XCircle,
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canConfirm = appointment.status === "pending";
  const canCancel = ["pending", "confirmed"].includes(appointment.status);
  const canComplete = appointment.status === "confirmed";

  return (
    <div className={styles.appointmentCard}>
      {/* Header */}
      <div className={styles.cardHeader} onClick={onToggleExpand}>
        <div className={styles.cardMainInfo}>
          <div className={styles.patientInfo}>
            <User className="w-5 h-5" />
            <div>
              <h3 className={styles.patientName}>
                {appointment.patient?.name ||
                  appointment.patientName ||
                  "Patient inconnu"}
              </h3>
              <p className={styles.appointmentDate}>
                {formatDate(appointment.date)} à {formatTime(appointment.date)}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.cardActions}>
          <div
            className={styles.statusBadge}
            style={{
              backgroundColor: `${statusConfig.color}15`,
              color: statusConfig.color,
            }}
          >
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
          </div>

          <button className={styles.expandButton}>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Détails expandables */}
      {isExpanded && (
        <div className={styles.cardDetails}>
          {/* Informations patient */}
          <div className={styles.detailsSection}>
            <h4>Informations Patient</h4>
            <div className={styles.detailsGrid}>
              {appointment.patient?.email && (
                <div className={styles.detailItem}>
                  <Mail className="w-4 h-4" />
                  <span>{appointment.patient.email}</span>
                </div>
              )}
              {appointment.patient?.phone && (
                <div className={styles.detailItem}>
                  <Phone className="w-4 h-4" />
                  <span>{appointment.patient.phone}</span>
                </div>
              )}
              {appointment.patient?.address && (
                <div className={styles.detailItem}>
                  <MapPin className="w-4 h-4" />
                  <span>{appointment.patient.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Analyses */}
          {appointment.analyses && appointment.analyses.length > 0 && (
            <div className={styles.detailsSection}>
              <h4>Analyses Demandées ({appointment.analyses.length})</h4>
              <div className={styles.analysesList}>
                {appointment.analyses.map((analysis, idx) => (
                  <div key={idx} className={styles.analysisItem}>
                    <TestTube className="w-4 h-4" />
                    <div className={styles.analysisInfo}>
                      <span className={styles.analysisName}>
                        {analysis.name}
                      </span>
                      <span className={styles.analysisPrice}>
                        {analysis.price} MAD
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.analysesTotal}>
                <strong>Total:</strong>
                <strong>{appointment.totalAmount || 0} MAD</strong>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className={styles.detailsSection}>
              <h4>Notes</h4>
              <p className={styles.notes}>{appointment.notes}</p>
            </div>
          )}

          {/* Facture */}
          {appointment.invoiceId && (
            <div className={styles.detailsSection}>
              <h4>Facture</h4>
              <div className={styles.invoiceInfo}>
                <FileText className="w-4 h-4" />
                <span>Facture #{appointment.invoiceId}</span>
                <DollarSign className="w-4 h-4" />
                <span>{appointment.totalAmount} MAD</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.cardActionsBar}>
            <button onClick={onViewDetails} className={styles.actionButton}>
              <Eye className="w-4 h-4" />
              Voir Détails
            </button>

            {canConfirm && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm();
                }}
                className={`${styles.actionButton} ${styles.confirmButton}`}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmer
              </button>
            )}

            {canComplete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className={`${styles.actionButton} ${styles.completeButton}`}
              >
                <CheckCircle className="w-4 h-4" />
                Terminer
              </button>
            )}

            {canCancel && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className={`${styles.actionButton} ${styles.cancelButton}`}
              >
                <XCircle className="w-4 h-4" />
                Annuler
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal de détails complets
const AppointmentDetailsModal = ({
  appointment,
  onClose,
  onConfirm,
  onCancel,
  onComplete,
}) => {
  const canConfirm = appointment.status === "pending";
  const canCancel = ["pending", "confirmed"].includes(appointment.status);
  const canComplete = appointment.status === "confirmed";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Détails du Rendez-vous</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Informations complètes */}
          <div className={styles.modalSection}>
            <h3>Informations Générales</h3>
            <div className={styles.infoGrid}>
              <div>
                <strong>Date:</strong>
                <span>
                  {new Date(appointment.date).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div>
                <strong>Heure:</strong>
                <span>
                  {new Date(appointment.date).toLocaleTimeString("fr-FR")}
                </span>
              </div>
              <div>
                <strong>Statut:</strong>
                <span>{appointment.status}</span>
              </div>
            </div>
          </div>

          {/* Patient */}
          <div className={styles.modalSection}>
            <h3>Patient</h3>
            <div className={styles.infoList}>
              <div>
                <strong>Nom:</strong> {appointment.patient?.name}
              </div>
              <div>
                <strong>Email:</strong> {appointment.patient?.email}
              </div>
              <div>
                <strong>Téléphone:</strong> {appointment.patient?.phone}
              </div>
            </div>
          </div>

          {/* Analyses */}
          {appointment.analyses && appointment.analyses.length > 0 && (
            <div className={styles.modalSection}>
              <h3>Analyses</h3>
              {appointment.analyses.map((analysis, idx) => (
                <div key={idx} className={styles.modalAnalysisItem}>
                  <span>{analysis.name}</span>
                  <span>{analysis.price} MAD</span>
                </div>
              ))}
              <div className={styles.modalTotal}>
                <strong>Total:</strong>
                <strong>{appointment.totalAmount} MAD</strong>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {canConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={styles.confirmButton}
            >
              Confirmer
            </button>
          )}

          {canComplete && (
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className={styles.completeButton}
            >
              Terminer
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => {
                onCancel();
                onClose();
              }}
              className={styles.cancelButton}
            >
              Annuler le RDV
            </button>
          )}

          <button onClick={onClose} className={styles.closeModalButton}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentsView;
