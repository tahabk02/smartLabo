import styles from "./RecentPatients.module.css";
import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectRecentPatients,
  selectSpecificLoading,
  selectDashboardError,
} from "../../features/dashboard/dashboardSlice";

function RecentPatients() {
  const navigate = useNavigate();
  const patients = useSelector(selectRecentPatients);
  const loading = useSelector(selectSpecificLoading("patients"));
  const error = useSelector(selectDashboardError);

  const formatDate = (date) => {
    if (!date) return "Date inconnue";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePatientClick = (patientId) => {
    navigate(`/patients/${patientId}`);
  };

  const handleViewAll = () => {
    navigate("/patients");
  };

  if (loading) {
    return (
      <div className={styles["dashboard-card"]}>
        <div className={styles["card-header"]}>
          <h3>
            <span className={styles["header-icon"]}>👥</span>
            Patients Récents
          </h3>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["loading-spinner"]}>
            <div className={styles["spinner"]}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["dashboard-card"]}>
        <div className={styles["card-header"]}>
          <h3>
            <span className={styles["header-icon"]}>👥</span>
            Patients Récents
          </h3>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["error-state"]}>
            <span className={styles["error-icon"]}>⚠️</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        styles["dashboard-card"] + " " + styles["recent-patients-card"]
      }
    >
      <div className={styles["card-header"]}>
        <h3>
          <span className={styles["header-icon"]}>👥</span>
          Patients Récents
        </h3>
        <button className={styles["view-all-btn"]} onClick={handleViewAll}>
          Voir tout →
        </button>
      </div>
      <div className={styles["card-body"]}>
        {patients.length === 0 ? (
          <div className={styles["empty-state"]}>
            <span className={styles["empty-state-icon"]}>👤</span>
            <h4 className={styles["empty-state-title"]}>Aucun patient</h4>
            <p className={styles["empty-state-text"]}>
              Commencez par ajouter votre premier patient
            </p>
            <button
              className={styles["add-patient-btn"]}
              onClick={() => navigate("/patients/nouveau")}
            >
              ➕ Ajouter un patient
            </button>
          </div>
        ) : (
          <div className={styles["patients-list"]}>
            {patients.map((patient) => (
              <div
                key={patient._id}
                className={styles["patient-item"]}
                onClick={() => handlePatientClick(patient._id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handlePatientClick(patient._id);
                }}
              >
                <div className={styles["patient-avatar"]}>
                  {patient.sexe === "M"
                    ? "👨"
                    : patient.sexe === "F"
                    ? "👩"
                    : "👤"}
                </div>
                <div className={styles["patient-info"]}>
                  <h4 className={styles["patient-name"]}>
                    {patient.prenom} {patient.nom}
                  </h4>
                  <p className={styles["patient-details"]}>
                    <span className={styles["patient-age"]}>
                      {patient.age ? `${patient.age} ans` : "Âge non renseigné"}
                    </span>
                    {patient.telephone && (
                      <>
                        <span className={styles["separator"]}>•</span>
                        <span className={styles["patient-phone"]}>
                          📞 {patient.telephone}
                        </span>
                      </>
                    )}
                  </p>
                  <p className={styles["patient-date"]}>
                    Ajouté le {formatDate(patient.createdAt)}
                  </p>
                </div>
                <div className={styles["patient-actions"]}>
                  <span className={styles["action-icon"]}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentPatients;
