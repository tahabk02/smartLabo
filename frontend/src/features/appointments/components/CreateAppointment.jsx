import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createAppointment,
  clearSuccess,
  clearError,
} from "../appointmentsSlice";

const CreateAppointment = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(
    (state) => state.appointments
  );
  const [formData, setFormData] = useState({
    date: "",
    analyses: [],
    notes: "",
  });
  const [analysesInput, setAnalysesInput] = useState("");

  const analysisOptions = [
    "Prise de sang",
    "Analyse d'urine",
    "Radiographie",
    "Échographie",
    "ECG",
    "Scanner",
    "IRM",
  ];

  const handleAddAnalysis = (analysis) => {
    if (!formData.analyses.includes(analysis)) {
      setFormData({
        ...formData,
        analyses: [...formData.analyses, analysis],
      });
    }
  };

  const handleRemoveAnalysis = (analysis) => {
    setFormData({
      ...formData,
      analyses: formData.analyses.filter((a) => a !== analysis),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || formData.analyses.length === 0) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    dispatch(createAppointment(formData));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Créer un rendez-vous</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Rendez-vous créé avec succès!
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Date et heure *</label>
            <input
              type="datetime-local"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Analyses *</label>
            <div className="analyses-selector">
              {analysisOptions.map((analysis) => (
                <button
                  key={analysis}
                  type="button"
                  className={`analysis-btn ${
                    formData.analyses.includes(analysis) ? "active" : ""
                  }`}
                  onClick={() => handleAddAnalysis(analysis)}
                >
                  {analysis}
                </button>
              ))}
            </div>
            <div className="selected-analyses">
              {formData.analyses.map((analysis) => (
                <span key={analysis} className="selected-tag">
                  {analysis}
                  <button
                    type="button"
                    onClick={() => handleRemoveAnalysis(analysis)}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Remarques additionnelles..."
              className="form-textarea"
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer rendez-vous"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAppointment;
