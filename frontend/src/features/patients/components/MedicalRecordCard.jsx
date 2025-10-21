import React from "react";
import styles from "./MedicalRecordCard.module.css";

const MedicalRecordCard = ({ record }) => {
  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "critique":
        return "#dc3545";
      case "urgent":
        return "#ffc107";
      default:
        return "#28a745";
    }
  };

  return (
    <div className="medical-record-card">
      <div className="card-header">
        <div className="date-badge">
          📅{" "}
          {new Date(record.visitDate).toLocaleDateString("fr-MA", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        <span
          className="urgency-badge"
          style={{ backgroundColor: getUrgencyColor(record.urgency) }}
        >
          {record.urgency === "critique"
            ? "🚨"
            : record.urgency === "urgent"
            ? "⚠️"
            : "✅"}
          {record.urgency.toUpperCase()}
        </span>
      </div>

      <div className="card-body">
        <h3 className="diagnosis">🔍 {record.diagnosis}</h3>

        <div className="info-section">
          <strong>Symptômes:</strong>
          <p>{record.symptoms}</p>
        </div>

        <div className="info-section">
          <strong>Traitement:</strong>
          <p>{record.treatment}</p>
        </div>

        {record.notes && (
          <div className="info-section notes">
            <strong>Notes:</strong>
            <p>{record.notes}</p>
          </div>
        )}

        {record.followUpDate && (
          <div className="follow-up">
            🔄 Suivi prévu:{" "}
            {new Date(record.followUpDate).toLocaleDateString("fr-MA")}
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="doctor-info">
          👨‍⚕️ Dr. {record.doctor?.firstName} {record.doctor?.lastName}
        </span>
        <span className="timestamp">
          Créé le {new Date(record.createdAt).toLocaleDateString("fr-MA")}
        </span>
      </div>
    </div>
  );
};

export default MedicalRecordCard;
