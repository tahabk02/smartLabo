import React, { useState, useEffect } from "react";
import axios from "axios";
import AnalysisCard from "./components/AnalysisCard";
import AnalysisForm from "./components/AnalysisForm";
import EmptyState from "../shared/EmptyState";
import LoadingSpinner from "../shared/LoadingSpinner";
import Modal from "../shared/Modal";
import styles from "./AnalysisSection.module.css";

const AnalysisSection = ({ patientId, onAddNew }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    fetchAnalyses();
  }, [patientId]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/patient-analyses/patient/${patientId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalyses(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement");
      console.error("Error fetching analyses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setSelectedAnalysis(null);
    setShowForm(true);
  };

  const handleEdit = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette analyse ?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/patient-analyses/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAnalyses();
      } catch (err) {
        console.error("Error deleting analysis:", err);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedAnalysis(null);
    fetchAnalyses();
  };

  if (loading) return <LoadingSpinner message="Chargement des analyses..." />;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>🧪 Analyses Médicales</h2>
        <button className={styles.btnAdd} onClick={handleAddNew}>
          ➕ Nouvelle Analyse
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {analyses.length === 0 ? (
          <EmptyState
            icon="🧪"
            message="Aucune analyse enregistrée"
            action={{
              label: "Ajouter une analyse",
              onClick: handleAddNew,
            }}
          />
        ) : (
          analyses.map((analysis) => (
            <AnalysisCard
              key={analysis._id}
              analysis={analysis}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={
            selectedAnalysis ? "✏️ Modifier Analyse" : "🧪 Nouvelle Analyse"
          }
          size="large"
        >
          <AnalysisForm
            patientId={patientId}
            analysis={selectedAnalysis}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default AnalysisSection;
