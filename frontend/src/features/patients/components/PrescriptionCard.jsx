import React from "react";
import styles from "./PrescriptionCard.module.css";

const PrescriptionCard = ({ prescription }) => {
  return (
    <div className="prescription-card">
      <div className="card-header">
        <div className="date-badge">
          📅{" "}
          {new Date(prescription.prescriptionDate).toLocaleDateString("fr-MA", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>
        <span className={`status-badge ${prescription.status}`}>
          {prescription.status === "active" ? "✅ Active" : "⏸️ Inactive"}
        </span>
      </div>

      <div className="card-body">
        <h3 className="diagnosis">🔍 {prescription.diagnosis}</h3>

        <div className="medications-list">
          <h4>💊 Médicaments prescrits:</h4>
          {prescription.medications.map((med, index) => (
            <div key={index} className="medication-item">
              <div className="med-header">
                <strong>{med.name}</strong>
                <span className="dosage">{med.dosage}</span>
              </div>
              <div className="med-details">
                <span>📊 {med.frequency}</span>
                <span>⏱️ {med.duration}</span>
              </div>
              {med.instructions && (
                <p className="instructions">ℹ️ {med.instructions}</p>
              )}
            </div>
          ))}
        </div>

        {prescription.notes && (
          <div className="notes-section">
            <strong>Notes:</strong>
            <p>{prescription.notes}</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="doctor-info">
          👨‍⚕️ Dr. {prescription.doctor?.firstName}{" "}
          {prescription.doctor?.lastName}
        </span>
        <span className="timestamp">
          Créée le{" "}
          {new Date(prescription.createdAt).toLocaleDateString("fr-MA")}
        </span>
      </div>
    </div>
  );
};

export default PrescriptionCard;
