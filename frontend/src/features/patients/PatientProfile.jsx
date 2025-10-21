import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPatientById, clearCurrentPatient } from "./patientsSlice";

// Components
import PatientProfileTabs from "./components/PatientProfileTabs";
import MedicalRecordForm from "./components/MedicalRecordForm";
import MedicalRecordCard from "./components/MedicalRecordCard";
import PrescriptionForm from "./components/PrescriptionForm";
import PrescriptionCard from "./components/PrescriptionCard";

// Shared Components
import Modal from "../shared/Modal";
import LoadingSpinner from "../shared/LoadingSpinner";
import EmptyState from "../shared/EmptyState";

// CSS Module
import styles from "./PatientProfile.module.css";

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux State
  const { currentPatient: patient, loading } = useSelector(
    (state) => state.patients
  );

  // Local State
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState("dossier");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  // Fetch patient data
  useEffect(() => {
    dispatch(fetchPatientById(id));
    fetchMedicalData();

    return () => {
      dispatch(clearCurrentPatient());
    };
  }, [id, dispatch]);

  const fetchMedicalData = async () => {
    try {
      // TODO: Fetch medical records, prescriptions, etc.
      // Ces appels seront ajoutés quand les endpoints seront prêts
      // await Promise.all([
      //   fetchMedicalRecords(id),
      //   fetchPrescriptions(id),
      // ]);
    } catch (error) {
      console.error("Erreur lors du chargement des données médicales:", error);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType("");
    fetchMedicalData();
  };

  // Calculate patient age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    } catch {
      return "N/A";
    }
  };

  const getModalTitle = () => {
    const titles = {
      medicalRecord: "📋 Nouvelle Consultation",
      prescription: "💊 Nouvelle Ordonnance",
      analysis: "🧪 Nouvelle Analyse",
      invoice: "💰 Nouvelle Facture",
    };
    return titles[modalType] || "";
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "medicalRecord":
        return (
          <MedicalRecordForm
            patientId={id}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        );
      case "prescription":
        return (
          <PrescriptionForm
            patientId={id}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        );
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Chargement du profil..." />;

  if (!patient)
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Patient introuvable</h2>
        <p>
          Le patient demandé n'existe pas ou vous n'avez pas les permissions.
        </p>
        <button
          className={styles.btnPrimary}
          onClick={() => navigate("/patients")}
        >
          ← Retour à la liste
        </button>
      </div>
    );

  return (
    <div className={styles.container}>
      {/* HEADER - Patient Info */}
      <div className={styles.profileHeader}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/patients")}
          aria-label="Retour"
        >
          ← Retour
        </button>

        <div className={styles.patientAvatar}>
          <div className={styles.avatarCircle}>{patient.name?.[0] || "P"}</div>
        </div>

        <div className={styles.patientInfo}>
          <h1>{patient.name || "N/A"}</h1>
          <div className={styles.patientMeta}>
            {patient.email && (
              <span className={styles.metaItem}>📧 {patient.email}</span>
            )}
            {patient.phone && (
              <span className={styles.metaItem}>📱 {patient.phone}</span>
            )}
            <span className={styles.metaItem}>
              🎂 {calculateAge(patient.dateOfBirth)} ans
            </span>
            {patient.bloodType && (
              <span className={styles.metaItem}>🩸 {patient.bloodType}</span>
            )}
          </div>
          {patient.address && (
            <div className={styles.patientAddress}>📍 {patient.address}</div>
          )}
          {patient.medicalHistory && (
            <div className={styles.medicalHistory}>
              <strong>Antécédents:</strong> {patient.medicalHistory}
            </div>
          )}
        </div>

        <div className={styles.profileActions}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/patients/${id}/edit`)}
          >
            ✏️ Modifier
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <PatientProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* TAB CONTENT */}
      <div className={styles.tabContent}>
        {/* DOSSIER MÉDICAL TAB */}
        {activeTab === "dossier" && (
          <div className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <h2>📋 Dossier Médical</h2>
              <button
                className={styles.btnAdd}
                onClick={() => openModal("medicalRecord")}
              >
                ➕ Nouvelle Consultation
              </button>
            </div>

            <div className={styles.recordsGrid}>
              {medicalRecords.length === 0 ? (
                <EmptyState
                  icon="📋"
                  message="Aucun dossier médical enregistré"
                  action={{
                    label: "Ajouter une consultation",
                    onClick: () => openModal("medicalRecord"),
                  }}
                />
              ) : (
                medicalRecords.map((record) => (
                  <MedicalRecordCard key={record._id} record={record} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ORDONNANCES TAB */}
        {activeTab === "ordonnances" && (
          <div className={styles.tabPanel}>
            <div className={styles.panelHeader}>
              <h2>💊 Ordonnances</h2>
              <button
                className={styles.btnAdd}
                onClick={() => openModal("prescription")}
              >
                ➕ Nouvelle Ordonnance
              </button>
            </div>

            <div className={styles.recordsGrid}>
              {prescriptions.length === 0 ? (
                <EmptyState
                  icon="💊"
                  message="Aucune ordonnance enregistrée"
                  action={{
                    label: "Créer une ordonnance",
                    onClick: () => openModal("prescription"),
                  }}
                />
              ) : (
                prescriptions.map((prescription) => (
                  <PrescriptionCard
                    key={prescription._id}
                    prescription={prescription}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ANALYSES TAB */}
        {activeTab === "analyses" && (
          <div className={styles.tabPanel}>
            <EmptyState
              icon="🧪"
              message="Section Analyses - En cours de développement"
            />
          </div>
        )}

        {/* FACTURATION TAB */}
        {activeTab === "facturation" && (
          <div className={styles.tabPanel}>
            <EmptyState
              icon="💰"
              message="Section Facturation - En cours de développement"
            />
          </div>
        )}
      </div>

      {/* MODALS */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={getModalTitle()}
        size="large"
      >
        {renderModalContent()}
      </Modal>
    </div>
  );
};

export default PatientProfile;
