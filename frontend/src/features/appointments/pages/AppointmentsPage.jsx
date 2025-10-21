// src/features/appointments/pages/AppointmentsPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAppointments,
  fetchAppointmentsByPatient,
  confirmAppointment,
  cancelAppointment,
  deleteAppointment,
  clearError,
  clearSuccess,
} from "../appointmentsSlice";
import { useAuth } from "../../../hooks/useAuth";
import styles from "./AppointmentsPage.module.css";
import {
  FiCalendar,
  FiUser,
  FiFilter,
  FiSearch,
  FiCheck,
  FiX,
  FiTrash2,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiMoreVertical,
} from "react-icons/fi";

const AppointmentsPage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { appointments, loading, error, success, message } = useSelector(
    (state) => state.appointments
  );
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.role === "patient") {
      dispatch(fetchAppointmentsByPatient(user.id));
    } else {
      dispatch(fetchAllAppointments());
    }
  }, [dispatch, user?.id, user?.role]);

  const handleConfirm = (appointmentId) => {
    if (window.confirm("Confirmer ce rendez-vous ?")) {
      dispatch(confirmAppointment(appointmentId));
    }
  };

  const handleCancel = (appointmentId) => {
    if (window.confirm("Annuler ce rendez-vous ?")) {
      dispatch(cancelAppointment(appointmentId));
    }
  };

  const handleDelete = (appointmentId) => {
    if (window.confirm("Supprimer ce rendez-vous ?")) {
      dispatch(deleteAppointment(appointmentId));
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 4000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const filteredAppointments = appointments
    .filter((apt) => {
      const matchesFilter = filter === "all" || apt.status === filter;
      const matchesSearch =
        apt.patient?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient?.numeroPatient?.includes(searchTerm);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date) - new Date(b.date);
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "patient":
          return `${a.patient?.nom}`.localeCompare(`${b.patient?.nom}`);
        default:
          return 0;
      }
    });

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "En attente",
        icon: FiClock,
        color: "pending",
        badge: "⏳",
      },
      confirmed: {
        label: "Confirmé",
        icon: FiCheck,
        color: "confirmed",
        badge: "✓",
      },
      cancelled: {
        label: "Annulé",
        icon: FiX,
        color: "cancelled",
        badge: "✕",
      },
      completed: {
        label: "Complété",
        icon: FiCheckCircle,
        color: "completed",
        badge: "✓✓",
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canTakeAction =
    user?.role &&
    ["admin", "doctor", "receptionist", "lab_tech"].includes(user.role);

  return (
    <div className={styles.appointmentsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleIcon}>
            <FiCalendar />
          </div>
          <div>
            <h1 className={styles.title}>Rendez-vous</h1>
            <p className={styles.subtitle}>
              Gérez tous vos rendez-vous médicaux
            </p>
          </div>
        </div>
        {user?.role === "patient" && (
          <button
            className={styles.btnPrimary}
            onClick={() => setShowModal(true)}
          >
            + Nouveau RDV
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={() => dispatch(clearError())}>✕</button>
        </div>
      )}
      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <FiCheckCircle />
          <span>{message}</span>
          <button onClick={() => dispatch(clearSuccess())}>✕</button>
        </div>
      )}

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
            <option value="completed">Complété</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="date">Date (croissant)</option>
            <option value="date-desc">Date (décroissant)</option>
            <option value="patient">Patient (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingContainer}>
          <FiLoader className={styles.spinner} />
          <p>Chargement des rendez-vous...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredAppointments.length === 0 && (
        <div className={styles.emptyState}>
          <FiCalendar className={styles.emptyIcon} />
          <h3>Aucun rendez-vous trouvé</h3>
          <p>
            {searchTerm
              ? "Modifiez vos critères de recherche"
              : "Créez votre premier rendez-vous"}
          </p>
        </div>
      )}

      {/* Appointments List */}
      {!loading && filteredAppointments.length > 0 && (
        <div className={styles.appointmentsList}>
          <div className={styles.listHeader}>
            <span>
              {filteredAppointments.length} rendez-vous
              {filter !== "all" && ` - ${filter}`}
            </span>
          </div>

          <div className={styles.cardsGrid}>
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onDelete={handleDelete}
                canTakeAction={canTakeAction}
                userRole={user?.role}
                getStatusConfig={getStatusConfig}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Appointment Card Component
const AppointmentCard = ({
  appointment,
  onConfirm,
  onCancel,
  onDelete,
  canTakeAction,
  userRole,
  getStatusConfig,
  formatDate,
}) => {
  const [showActions, setShowActions] = useState(false);
  const statusConfig = getStatusConfig(appointment.status);

  return (
    <div className={`${styles.card} ${styles[`card-${statusConfig.color}`]}`}>
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div className={styles.statusBadge}>
          <span className={styles.badge}>{statusConfig.badge}</span>
          <span>{statusConfig.label}</span>
        </div>
        {canTakeAction && (
          <button
            className={styles.menuBtn}
            onClick={() => setShowActions(!showActions)}
          >
            <FiMoreVertical />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className={styles.cardBody}>
        {/* Patient Info */}
        <div className={styles.patientInfo}>
          <div className={styles.patientAvatar}>
            {appointment.patient?.nom?.[0]}
            {appointment.patient?.prenom?.[0]}
          </div>
          <div className={styles.patientDetails}>
            <h3>
              {appointment.patient?.nom} {appointment.patient?.prenom}
            </h3>
            <p>ID: {appointment.patient?.numeroPatient}</p>
          </div>
        </div>

        {/* Appointment Details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>📅 Date</span>
            <span className={styles.value}>{formatDate(appointment.date)}</span>
          </div>

          {appointment.analyses && appointment.analyses.length > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.label}>🔬 Analyses</span>
              <div className={styles.analysesList}>
                {appointment.analyses.map((analyse, idx) => (
                  <span key={idx} className={styles.analysisTag}>
                    {analyse}
                  </span>
                ))}
              </div>
            </div>
          )}

          {appointment.notes && (
            <div className={styles.detailRow}>
              <span className={styles.label}>📝 Notes</span>
              <span className={styles.notes}>{appointment.notes}</span>
            </div>
          )}

          {appointment.facture && (
            <div className={styles.detailRow}>
              <span className={styles.label}>🧾 Facture</span>
              <span className={styles.factureLink}>
                {appointment.facture.numeroFacture}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className={styles.cardFooter}>
        {canTakeAction && (
          <>
            {appointment.status === "pending" && (
              <>
                <button
                  className={`${styles.btn} ${styles.btnConfirm}`}
                  onClick={() => onConfirm(appointment._id)}
                >
                  <FiCheck /> Confirmer
                </button>
                <button
                  className={`${styles.btn} ${styles.btnCancel}`}
                  onClick={() => onCancel(appointment._id)}
                >
                  <FiX /> Annuler
                </button>
              </>
            )}
            {appointment.status === "confirmed" && (
              <button
                className={`${styles.btn} ${styles.btnCancel}`}
                onClick={() => onCancel(appointment._id)}
              >
                <FiX /> Annuler
              </button>
            )}
            {userRole === "admin" && (
              <button
                className={`${styles.btn} ${styles.btnDelete}`}
                onClick={() => onDelete(appointment._id)}
              >
                <FiTrash2 /> Supprimer
              </button>
            )}
          </>
        )}

        {/* Action Menu Mobile */}
        {canTakeAction && showActions && (
          <div className={styles.actionMenu}>
            {appointment.status === "pending" && (
              <>
                <button
                  onClick={() => {
                    onConfirm(appointment._id);
                    setShowActions(false);
                  }}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => {
                    onCancel(appointment._id);
                    setShowActions(false);
                  }}
                >
                  Annuler
                </button>
              </>
            )}
            {userRole === "admin" && (
              <button
                onClick={() => {
                  onDelete(appointment._id);
                  setShowActions(false);
                }}
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
