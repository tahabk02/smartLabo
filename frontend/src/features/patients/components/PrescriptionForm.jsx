import React, { useState, useCallback, useMemo } from "react";
import axios from "axios";
import styles from "./PrescriptionForm.module.css";

const INITIAL_MEDICATION = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const INITIAL_FORM_DATA = {
  prescriptionDate: new Date().toISOString().split("T")[0],
  diagnosis: "",
  notes: "",
};

const PrescriptionForm = ({ patientId, onSuccess, onCancel }) => {
  const [medications, setMedications] = useState([INITIAL_MEDICATION]);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Memoize valid medications
  const validMedications = useMemo(
    () => medications.filter((m) => m.name.trim() !== ""),
    [medications]
  );

  // Check if form is valid
  const isFormValid = useMemo(
    () =>
      formData.diagnosis.trim() !== "" &&
      formData.prescriptionDate &&
      validMedications.length > 0,
    [formData, validMedications]
  );

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleMedicationChange = useCallback((index, field, value) => {
    setMedications((prev) => {
      const newMedications = [...prev];
      newMedications[index][field] = value;
      return newMedications;
    });
  }, []);

  const addMedication = useCallback(() => {
    setMedications((prev) => [...prev, INITIAL_MEDICATION]);
  }, []);

  const removeMedication = useCallback((index) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
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
        "/api/prescriptions",
        {
          ...formData,
          patient: patientId,
          medications: validMedications,
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
        "Erreur lors de la création de l'ordonnance";
      setError(message);
      console.error("Prescription creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <div className={styles.errorMessage} role="alert">
          ❌ {error}
        </div>
      )}

      {/* PRESCRIPTION INFO */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="prescriptionDate">
            Date d'ordonnance <span className={styles.required}>*</span>
          </label>
          <input
            id="prescriptionDate"
            type="date"
            name="prescriptionDate"
            value={formData.prescriptionDate}
            onChange={handleChange}
            required
            aria-required="true"
          />
        </div>

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
            placeholder="Diagnostic associé"
            required
            aria-required="true"
          />
        </div>
      </div>

      {/* MEDICATIONS SECTION */}
      <div className={styles.medicationsSection}>
        <div className={styles.sectionHeader}>
          <h3>💊 Médicaments</h3>
          <button
            type="button"
            className={styles.btnAddMed}
            onClick={addMedication}
            aria-label="Ajouter un nouveau médicament"
          >
            ➕ Ajouter Médicament
          </button>
        </div>

        {medications.length === 0 && (
          <div className={styles.emptyMessage}>
            Aucun médicament ajouté. Cliquez sur "Ajouter Médicament" pour
            commencer.
          </div>
        )}

        {medications.map((med, index) => (
          <div key={index} className={styles.medicationItem}>
            <div className={styles.medicationHeader}>
              <span>Médicament #{index + 1}</span>
              {medications.length > 1 && (
                <button
                  type="button"
                  className={styles.btnRemove}
                  onClick={() => removeMedication(index)}
                  aria-label={`Supprimer le médicament ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor={`med-name-${index}`}>
                  Nom du médicament <span className={styles.required}>*</span>
                </label>
                <input
                  id={`med-name-${index}`}
                  type="text"
                  value={med.name}
                  onChange={(e) =>
                    handleMedicationChange(index, "name", e.target.value)
                  }
                  placeholder="Ex: Paracétamol"
                  required={med.name.trim() !== "" || medications.length === 1}
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={`med-dosage-${index}`}>
                  Dosage <span className={styles.required}>*</span>
                </label>
                <input
                  id={`med-dosage-${index}`}
                  type="text"
                  value={med.dosage}
                  onChange={(e) =>
                    handleMedicationChange(index, "dosage", e.target.value)
                  }
                  placeholder="Ex: 500mg"
                  required={med.name.trim() !== ""}
                  aria-required="true"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor={`med-frequency-${index}`}>
                  Fréquence <span className={styles.required}>*</span>
                </label>
                <input
                  id={`med-frequency-${index}`}
                  type="text"
                  value={med.frequency}
                  onChange={(e) =>
                    handleMedicationChange(index, "frequency", e.target.value)
                  }
                  placeholder="Ex: 3 fois/jour"
                  required={med.name.trim() !== ""}
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={`med-duration-${index}`}>
                  Durée <span className={styles.required}>*</span>
                </label>
                <input
                  id={`med-duration-${index}`}
                  type="text"
                  value={med.duration}
                  onChange={(e) =>
                    handleMedicationChange(index, "duration", e.target.value)
                  }
                  placeholder="Ex: 7 jours"
                  required={med.name.trim() !== ""}
                  aria-required="true"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor={`med-instructions-${index}`}>Instructions</label>
              <textarea
                id={`med-instructions-${index}`}
                value={med.instructions}
                onChange={(e) =>
                  handleMedicationChange(index, "instructions", e.target.value)
                }
                placeholder="Instructions spécifiques (Ex: À prendre avec de la nourriture)..."
                rows="2"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ADDITIONAL NOTES */}
      <div className={styles.formGroup}>
        <label htmlFor="notes">Notes additionnelles</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Notes complémentaires, recommandations, mises en garde..."
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
          {loading ? "⏳ Enregistrement..." : "✓ Créer Ordonnance"}
        </button>
      </div>
    </form>
  );
};

export default PrescriptionForm;
