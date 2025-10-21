import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import styles from "./MedicalRecordForm.module.css";

const URGENCY_LEVELS = [
  { value: "normal", label: "Normal", icon: "🟢" },
  { value: "urgent", label: "Urgent", icon: "🟡" },
  { value: "critique", label: "Critique", icon: "🔴" },
];

const INITIAL_FORM_DATA = {
  visitDate: new Date().toISOString().split("T")[0],
  symptoms: "",
  diagnosis: "",
  treatment: "",
  notes: "",
  urgency: "normal",
  followUpDate: "",
};

const MedicalRecordForm = ({ patientId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate form
  const isFormValid = useMemo(
    () =>
      formData.visitDate &&
      formData.symptoms.trim() !== "" &&
      formData.diagnosis.trim() !== "" &&
      formData.treatment.trim() !== "",
    [formData]
  );

  const minFollowUpDate = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      await axios.post(
        "/api/medical-records",
        {
          ...formData,
          patient: patientId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      onSuccess();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la création du dossier médical";
      setError(message);
      console.error("Medical record creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyLabel = (value) => {
    const urgency = URGENCY_LEVELS.find((u) => u.value === value);
    return urgency ? `${urgency.icon} ${urgency.label}` : value;
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorMessage} role="alert">
          ❌ {error}
        </div>
      )}

      {/* VISIT DATE & URGENCY */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="visitDate">
            Date de visite <span className={styles.required}>*</span>
          </label>
          <input
            id="visitDate"
            type="date"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            required
            aria-required="true"
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="urgency">
            Niveau d'urgence <span className={styles.required}>*</span>
          </label>
          <select
            id="urgency"
            name="urgency"
            value={formData.urgency}
            onChange={handleChange}
            required
            aria-required="true"
            className={
              styles[
                `urgency${
                  formData.urgency.charAt(0).toUpperCase() +
                  formData.urgency.slice(1)
                }`
              ]
            }
          >
            {URGENCY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {getUrgencyLabel(level.value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SYMPTOMS */}
      <div className={styles.formGroup}>
        <label htmlFor="symptoms">
          Symptômes <span className={styles.required}>*</span>
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          value={formData.symptoms}
          onChange={handleChange}
          rows="3"
          placeholder="Décrivez les symptômes du patient (douleurs, fièvre, malaise, etc.)..."
          required
          aria-required="true"
          maxLength={1000}
        />
        <span className={styles.charCount}>
          {formData.symptoms.length}/1000
        </span>
      </div>

      {/* DIAGNOSIS */}
      <div className={styles.formGroup}>
        <label htmlFor="diagnosis">
          Diagnostic <span className={styles.required}>*</span>
        </label>
        <input
          id="diagnosis"
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          placeholder="Ex: Grippe, Hypertension artérielle, etc."
          required
          aria-required="true"
          maxLength={200}
        />
      </div>

      {/* TREATMENT */}
      <div className={styles.formGroup}>
        <label htmlFor="treatment">
          Traitement <span className={styles.required}>*</span>
        </label>
        <textarea
          id="treatment"
          name="treatment"
          value={formData.treatment}
          onChange={handleChange}
          rows="3"
          placeholder="Traitement prescrit (médicaments, repos, régime, etc.)..."
          required
          aria-required="true"
          maxLength={1000}
        />
        <span className={styles.charCount}>
          {formData.treatment.length}/1000
        </span>
      </div>

      {/* ADDITIONAL NOTES */}
      <div className={styles.formGroup}>
        <label htmlFor="notes">Notes additionnelles</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="2"
          placeholder="Notes complémentaires, observations importantes..."
          maxLength={500}
        />
        <span className={styles.charCount}>{formData.notes.length}/500</span>
      </div>

      {/* FOLLOW UP DATE */}
      <div className={styles.formGroup}>
        <label htmlFor="followUpDate">Date de suivi recommandée</label>
        <input
          id="followUpDate"
          type="date"
          name="followUpDate"
          value={formData.followUpDate}
          onChange={handleChange}
          min={minFollowUpDate}
        />
      </div>

      {/* FORM ACTIONS */}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.btnCancel}
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={loading || !isFormValid}
          aria-busy={loading}
        >
          {loading ? "⏳ Enregistrement..." : "✓ Enregistrer"}
        </button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;
