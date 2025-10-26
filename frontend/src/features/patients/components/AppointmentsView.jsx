// src/features/patients/components/AppointmentsView.jsx

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  TestTube,
  Plus,
  X,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
} from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./AppointmentsView.module.css";

const AppointmentsView = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await patientApi.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    try {
      await patientApi.createAppointment(appointmentData);
      alert("✅ Rendez-vous créé avec succès!");
      setShowCreateModal(false);
      loadAppointments();
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("❌ Erreur lors de la création du rendez-vous");
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous?")) {
      return;
    }

    try {
      await patientApi.cancelAppointment(appointmentId);
      alert("✅ Rendez-vous annulé");
      loadAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("❌ Erreur lors de l'annulation");
    }
  };

  const filteredAppointments = appointments.filter((apt) =>
    filterStatus === "all" ? true : apt.status === filterStatus
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Mes Rendez-vous</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className={styles.newButton}
        >
          <Plus className="w-4 h-4" />
          Nouveau Rendez-vous
        </button>
      </div>

      {/* Filtres */}
      <div className={styles.tabs}>
        {[
          { id: "all", label: "Tous" },
          { id: "pending", label: "En attente" },
          { id: "confirmed", label: "Confirmés" },
          { id: "completed", label: "Terminés" },
          { id: "cancelled", label: "Annulés" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`${styles.tab} ${
              filterStatus === tab.id ? styles.active : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Liste des rendez-vous */}
      {filteredAppointments.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Aucun rendez-vous</h3>
          <p className={styles.emptyText}>
            Vous n'avez pas encore de rendez-vous
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.newButton}
          >
            <Plus className="w-4 h-4" />
            Prendre un rendez-vous
          </button>
        </div>
      ) : (
        <div className={styles.appointmentsList}>
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onViewDetails={() => setSelectedAppointment(appointment)}
              onCancel={() => handleCancelAppointment(appointment._id)}
            />
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <CreateAppointmentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAppointment}
        />
      )}

      {/* Modal de détails */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancelAppointment}
        />
      )}
    </div>
  );
};

// Carte de rendez-vous
const AppointmentCard = ({ appointment, onViewDetails, onCancel }) => {
  const [expanded, setExpanded] = useState(false);

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

  const canCancel = ["pending", "confirmed"].includes(appointment.status);

  return (
    <div
      className={`${styles.appointmentCard} ${
        styles[appointment.status] || ""
      }`}
    >
      <div className={styles.appointmentHeader}>
        <div className={styles.appointmentInfo}>
          <h3 className={styles.doctorName}>
            Rendez-vous - {formatDate(appointment.date)}
          </h3>
          <p className={styles.specialty}>
            <Clock className="w-4 h-4" />
            {formatTime(appointment.date)}
          </p>
        </div>
        <div
          className={`${styles.appointmentBadge} ${styles[appointment.status]}`}
        >
          {appointment.status === "pending" && (
            <AlertCircle className="w-4 h-4" />
          )}
          {appointment.status === "confirmed" && (
            <CheckCircle className="w-4 h-4" />
          )}
          {appointment.status === "cancelled" && (
            <XCircle className="w-4 h-4" />
          )}
          {appointment.status === "completed" && (
            <CheckCircle className="w-4 h-4" />
          )}
          <span>{getStatusLabel(appointment.status)}</span>
        </div>
      </div>

      <div className={styles.appointmentDetails}>
        {appointment.assignedStaff && (
          <div className={styles.detailItem}>
            <User className="w-4 h-4" />
            <span className={styles.detailValue}>
              {appointment.assignedStaff.name}
            </span>
          </div>
        )}
        {appointment.analyses && appointment.analyses.length > 0 && (
          <div className={styles.detailItem}>
            <TestTube className="w-4 h-4" />
            <span className={styles.detailValue}>
              {appointment.analyses.length} analyse(s)
            </span>
          </div>
        )}
        {appointment.totalAmount > 0 && (
          <div className={styles.detailItem}>
            <DollarSign className="w-4 h-4" />
            <span className={styles.detailValue}>
              {appointment.totalAmount} MAD
            </span>
          </div>
        )}
      </div>

      {appointment.notes && (
        <div className={styles.appointmentNotes}>
          <p className={styles.notesLabel}>Notes</p>
          <p className={styles.notesText}>{appointment.notes}</p>
        </div>
      )}

      {/* Analyses sélectionnées */}
      {expanded && appointment.analyses && appointment.analyses.length > 0 && (
        <div className={styles.analysesSection}>
          <h4>Analyses programmées:</h4>
          <div className={styles.analysesList}>
            {appointment.analyses.map((analysis, idx) => (
              <div key={idx} className={styles.analysisItem}>
                <span>{analysis.name}</span>
                <span>{analysis.price} MAD</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.appointmentActions}>
        <button onClick={onViewDetails} className={styles.detailsButton}>
          <Eye className="w-4 h-4" />
          Détails
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className={styles.detailsButton}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {expanded ? "Réduire" : "Étendre"}
        </button>
        {canCancel && (
          <button onClick={onCancel} className={styles.cancelButton}>
            <XCircle className="w-4 h-4" />
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

// Modal de création de rendez-vous avec sélection d'analyses
const CreateAppointmentModal = ({ onClose, onCreate }) => {
  const [step, setStep] = useState(1); // 1: Date, 2: Analyses, 3: Confirmation
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableAnalyses, setAvailableAnalyses] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAvailableSlots();
    loadAvailableAnalyses();
  }, []);

  const loadAvailableSlots = async () => {
    try {
      const slots = await patientApi.getAvailableSlots();
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const loadAvailableAnalyses = async () => {
    try {
      const analyses = await patientApi.getAvailableAnalyses();
      setAvailableAnalyses(analyses);
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
  };

  const toggleAnalysis = (analysis) => {
    setSelectedAnalyses((prev) => {
      const exists = prev.find((a) => a._id === analysis._id);
      if (exists) {
        return prev.filter((a) => a._id !== analysis._id);
      } else {
        return [...prev, analysis];
      }
    });
  };

  const calculateTotal = () => {
    return selectedAnalyses.reduce((sum, analysis) => sum + analysis.price, 0);
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      alert("Veuillez sélectionner une date et heure");
      return;
    }

    if (selectedAnalyses.length === 0) {
      if (!window.confirm("Aucune analyse sélectionnée. Continuer?")) {
        return;
      }
    }

    setLoading(true);
    try {
      await onCreate({
        date: selectedSlot,
        analyses: selectedAnalyses.map((a) => a._id),
        notes,
        totalAmount: calculateTotal(),
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = availableAnalyses.filter((analysis) =>
    analysis.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nouveau Rendez-vous</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Indicateur d'étapes */}
        <div className={styles.stepsIndicator}>
          <div
            className={`${styles.step} ${step >= 1 ? styles.activeStep : ""}`}
          >
            <div className={styles.stepNumber}>1</div>
            <span>Date & Heure</span>
          </div>
          <div className={styles.stepLine}></div>
          <div
            className={`${styles.step} ${step >= 2 ? styles.activeStep : ""}`}
          >
            <div className={styles.stepNumber}>2</div>
            <span>Analyses</span>
          </div>
          <div className={styles.stepLine}></div>
          <div
            className={`${styles.step} ${step >= 3 ? styles.activeStep : ""}`}
          >
            <div className={styles.stepNumber}>3</div>
            <span>Confirmation</span>
          </div>
        </div>

        <div className={styles.modalBody}>
          {/* Étape 1: Sélection de date */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <h4>Choisissez une date et heure</h4>
              <div className={styles.slotsGrid}>
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`${styles.slotButton} ${
                      selectedSlot === slot ? styles.slotSelected : ""
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <div>
                      <div className={styles.slotDate}>
                        {new Date(slot).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className={styles.slotTime}>
                        {new Date(slot).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 2: Sélection d'analyses */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <h4>Sélectionnez les analyses souhaitées</h4>

              {/* Recherche */}
              <div className={styles.searchBox}>
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher une analyse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {/* Liste des analyses */}
              <div className={styles.analysesGrid}>
                {filteredAnalyses.map((analysis) => {
                  const isSelected = selectedAnalyses.some(
                    (a) => a._id === analysis._id
                  );
                  return (
                    <div
                      key={analysis._id}
                      onClick={() => toggleAnalysis(analysis)}
                      className={`${styles.analysisCard} ${
                        isSelected ? styles.analysisSelected : ""
                      }`}
                    >
                      <div className={styles.analysisCheckbox}>
                        {isSelected && <CheckCircle className="w-5 h-5" />}
                      </div>
                      <div className={styles.analysisInfo}>
                        <h5>{analysis.name}</h5>
                        <p className={styles.analysisCategory}>
                          {analysis.category}
                        </p>
                        <p className={styles.analysisPrice}>
                          {analysis.price} MAD
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Résumé sélection */}
              {selectedAnalyses.length > 0 && (
                <div className={styles.selectionSummary}>
                  <h5>Analyses sélectionnées: {selectedAnalyses.length}</h5>
                  <div className={styles.selectedList}>
                    {selectedAnalyses.map((analysis) => (
                      <div key={analysis._id} className={styles.selectedItem}>
                        <span>{analysis.name}</span>
                        <span>{analysis.price} MAD</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.totalPrice}>
                    <strong>Total:</strong>
                    <strong>{calculateTotal()} MAD</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Confirmation */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <h4>Confirmation du rendez-vous</h4>

              <div className={styles.confirmationSummary}>
                <div className={styles.summarySection}>
                  <h5>Date et heure</h5>
                  <p>
                    {new Date(selectedSlot).toLocaleString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className={styles.summarySection}>
                  <h5>Analyses ({selectedAnalyses.length})</h5>
                  {selectedAnalyses.map((analysis) => (
                    <div key={analysis._id} className={styles.summaryItem}>
                      <span>{analysis.name}</span>
                      <span>{analysis.price} MAD</span>
                    </div>
                  ))}
                </div>

                <div className={styles.summaryTotal}>
                  <span>Montant total:</span>
                  <strong>{calculateTotal()} MAD</strong>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Notes (optionnel)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez des notes ou instructions particulières..."
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.formActions}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className={styles.cancelModalButton}
            >
              Retour
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedSlot}
              className={styles.submitButton}
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Création..." : "Confirmer le rendez-vous"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de détails
const AppointmentDetailsModal = ({ appointment, onClose, onCancel }) => {
  const canCancel = ["pending", "confirmed"].includes(appointment.status);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Détails du Rendez-vous</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={styles.detailsContent}>
          {/* Informations générales */}
          <div className={styles.detailsSection}>
            <h4>Informations générales</h4>
            <div className={styles.detailsGrid}>
              <div>
                <span>Date:</span>
                <strong>
                  {new Date(appointment.date).toLocaleDateString("fr-FR")}
                </strong>
              </div>
              <div>
                <span>Heure:</span>
                <strong>
                  {new Date(appointment.date).toLocaleTimeString("fr-FR")}
                </strong>
              </div>
              <div>
                <span>Statut:</span>
                <span
                  className={`${styles.appointmentBadge} ${
                    styles[appointment.status]
                  }`}
                >
                  {getStatusLabel(appointment.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Analyses */}
          {appointment.analyses && appointment.analyses.length > 0 && (
            <div className={styles.detailsSection}>
              <h4>Analyses programmées</h4>
              {appointment.analyses.map((analysis, idx) => (
                <div key={idx} className={styles.analysisDetailItem}>
                  <TestTube className="w-4 h-4" />
                  <div>
                    <strong>{analysis.name}</strong>
                    <p>{analysis.price} MAD</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Facture */}
          {appointment.invoiceId && (
            <div className={styles.detailsSection}>
              <h4>Facture</h4>
              <p>Numéro: {appointment.invoiceId}</p>
              <p>Montant: {appointment.totalAmount} MAD</p>
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          {canCancel && (
            <button
              onClick={() => {
                onCancel(appointment._id);
                onClose();
              }}
              className={styles.cancelButton}
            >
              Annuler le RDV
            </button>
          )}
          <button onClick={onClose} className={styles.cancelModalButton}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getStatusLabel = (status) => {
  const labels = {
    pending: "En attente",
    confirmed: "Confirmé",
    in_progress: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
    no_show: "Non honoré",
  };
  return labels[status] || status;
};

export default AppointmentsView;
