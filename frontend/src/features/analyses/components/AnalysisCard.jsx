import React from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import styles from "./AnalysisCard.module.css";

const AnalysisCard = ({ analysis, onEdit, onDelete }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case "completed":
        return { label: "Terminé", color: "#28a745", icon: "✅" };
      case "in-progress":
        return { label: "En cours", color: "#ffc107", icon: "⏳" };
      case "pending":
        return { label: "En attente", color: "#6c757d", icon: "⏸️" };
      default:
        return { label: status, color: "#6c757d", icon: "❓" };
    }
  };

  const statusInfo = getStatusInfo(analysis.status);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.typeInfo}>
          <span className={styles.icon}>🧪</span>
          <div>
            <h3>{analysis.analysisType?.name || "Type inconnu"}</h3>
            <p className={styles.date}>
              {new Date(analysis.analysisDate).toLocaleDateString("fr-MA", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btnEdit}
            onClick={() => onEdit(analysis)}
            title="Modifier"
          >
            <FiEdit />
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => onDelete(analysis._id)}
            title="Supprimer"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div
          className={styles.statusBadge}
          style={{ backgroundColor: statusInfo.color }}
        >
          {statusInfo.icon} {statusInfo.label}
        </div>

        {analysis.analysisType?.description && (
          <div className={styles.section}>
            <strong>Description:</strong>
            <p>{analysis.analysisType.description}</p>
          </div>
        )}

        {analysis.results && (
          <div className={styles.section}>
            <strong>Résultats:</strong>
            <p className={styles.results}>{analysis.results}</p>
          </div>
        )}

        {analysis.notes && (
          <div className={styles.section}>
            <strong>Notes:</strong>
            <p>{analysis.notes}</p>
          </div>
        )}

        <div className={styles.priceTag}>
          💰 {analysis.analysisType?.price || 0} DH
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.doctorInfo}>
          👨‍⚕️ {analysis.doctor?.firstName} {analysis.doctor?.lastName}
        </span>
        <span className={styles.timestamp}>
          Créé le {new Date(analysis.createdAt).toLocaleDateString("fr-MA")}
        </span>
      </div>
    </div>
  );
};

export default AnalysisCard;
