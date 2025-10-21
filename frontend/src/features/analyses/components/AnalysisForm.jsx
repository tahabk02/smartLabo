import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./AnalysisForm.module.css";

const AnalysisForm = ({ patientId, analysis, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    analysisType: "",
    analysisDate: new Date().toISOString().split("T")[0],
    results: "",
    notes: "",
    status: "pending",
  });
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalysisTypes();
    if (analysis) {
      setFormData({
        analysisType: analysis.analysisType?._id || "",
        analysisDate: new Date(analysis.analysisDate)
          .toISOString()
          .split("T")[0],
        results: analysis.results || "",
        notes: analysis.notes || "",
        status: analysis.status || "pending",
      });
    }
  }, [analysis]);

  const fetchAnalysisTypes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/analyse-types", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalysisTypes(response.data);
    } catch (err) {
      console.error("Error fetching analysis types:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        ...formData,
        patient: patientId,
      };

      if (analysis) {
        await axios.put(
          `/api/patient-analyses/${analysis._id}`,
          payload,
          config
        );
      } else {
        await axios.post("/api/patient-analyses", payload, config);
      }

      onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Type d'analyse *</label>
          <select
            name="analysisType"
            value={formData.analysisType}
            onChange={handleChange}
            required
          >
            <option value="">Sélectionner un type</option>
            {analysisTypes.map((type) => (
              <option key={type._id} value={type._id}>
                {type.name} - {type.price} DH
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Date d'analyse *</label>
          <input
            type="date"
            name="analysisDate"
            value={formData.analysisDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label>Statut *</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          <option value="pending">En attente</option>
          <option value="in-progress">En cours</option>
          <option value="completed">Terminé</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>Résultats</label>
        <textarea
          name="results"
          value={formData.results}
          onChange={handleChange}
          rows="4"
          placeholder="Entrez les résultats de l'analyse..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>Notes additionnelles</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Notes complémentaires..."
        />
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.btnCancel} onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className={styles.btnSubmit} disabled={loading}>
          {loading
            ? "Enregistrement..."
            : analysis
            ? "Modifier"
            : "Enregistrer"}
        </button>
      </div>
    </form>
  );
};

export default AnalysisForm;
