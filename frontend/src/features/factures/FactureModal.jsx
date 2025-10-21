import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./Factures.module.css";
import { createFacture, updateFacture } from "./facturesSlice";
import { fetchPatients } from "../patients/patientsSlice";
import { fetchAnalyses } from "../analyses/analysesSlice";
import { toast } from "react-toastify";

function FactureModal({
  isOpen,
  onClose,
  facture,
  preSelectedPatientId = null,
}) {
  const dispatch = useDispatch();
  const { patients } = useSelector((state) => state.patients);
  const { analyses } = useSelector((state) => state.analyses);
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    patientId: preSelectedPatientId || "",
    analyses: [],
    dateFacture: new Date().toISOString().split("T")[0],
    montantTotal: 0,
    montantPaye: 0,
    statut: "En attente",
  });

  const [selectedAnalyse, setSelectedAnalyse] = useState("");
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function pour afficher le nom du patient
  const getPatientDisplayName = (patient) => {
    if (patient.name) return patient.name;
    if (patient.nom && patient.prenom) {
      return patient.nom + " " + patient.prenom;
    }
    return "Patient sans nom";
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPatients());
      dispatch(fetchAnalyses());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (facture) {
      setFormData({
        patientId: facture.patientId?._id || facture.patientId || "",
        analyses: facture.analyses || [],
        dateFacture: facture.dateFacture
          ? new Date(facture.dateFacture).toISOString().split("T")[0]
          : "",
        montantTotal: facture.montantTotal || 0,
        montantPaye: facture.montantPaye || 0,
        statut: facture.statut || "En attente",
      });
      setSelectedAnalyses(facture.analyses || []);
    } else if (preSelectedPatientId) {
      setFormData((prev) => ({
        ...prev,
        patientId: preSelectedPatientId,
      }));
    } else {
      resetForm();
    }
  }, [facture, preSelectedPatientId]);

  const resetForm = () => {
    setFormData({
      patientId: preSelectedPatientId || "",
      analyses: [],
      dateFacture: new Date().toISOString().split("T")[0],
      montantTotal: 0,
      montantPaye: 0,
      statut: "En attente",
    });
    setSelectedAnalyses([]);
    setSelectedAnalyse("");
  };

  const handleAddAnalyse = () => {
    if (
      selectedAnalyse &&
      !selectedAnalyses.find((a) => a.analyseId === selectedAnalyse)
    ) {
      const analyse = analyses.find((a) => a._id === selectedAnalyse);
      if (analyse) {
        const newAnalyse = {
          analyseId: analyse._id,
          nom: analyse.nom,
          prix: analyse.prix,
          quantite: 1,
        };
        const updatedAnalyses = [...selectedAnalyses, newAnalyse];
        setSelectedAnalyses(updatedAnalyses);
        calculateTotal(updatedAnalyses);
        setSelectedAnalyse("");
      }
    }
  };

  const handleRemoveAnalyse = (analyseId) => {
    const updatedAnalyses = selectedAnalyses.filter(
      (a) => a.analyseId !== analyseId
    );
    setSelectedAnalyses(updatedAnalyses);
    calculateTotal(updatedAnalyses);
  };

  const handleQuantiteChange = (analyseId, quantite) => {
    const updatedAnalyses = selectedAnalyses.map((a) =>
      a.analyseId === analyseId
        ? { ...a, quantite: Math.max(parseInt(quantite) || 1, 1) }
        : a
    );
    setSelectedAnalyses(updatedAnalyses);
    calculateTotal(updatedAnalyses);
  };

  const calculateTotal = (analysesArray) => {
    const total = analysesArray.reduce(
      (sum, a) => sum + a.prix * a.quantite,
      0
    );
    setFormData((prev) => ({
      ...prev,
      montantTotal: total,
      analyses: analysesArray,
      montantPaye: prev.montantPaye > total ? total : prev.montantPaye,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!["admin", "doctor"].includes(user?.role)) {
      toast.error(
        "Vous n'avez pas la permission de créer ou modifier cette facture"
      );
      return;
    }

    if (!formData.patientId || selectedAnalyses.length === 0) {
      toast.error("Veuillez sélectionner un patient et au moins une analyse");
      return;
    }

    if (formData.montantPaye > formData.montantTotal) {
      toast.error("Le montant payé ne peut pas dépasser le montant total");
      return;
    }

    const dataToSend = { ...formData, analyses: selectedAnalyses };

    setLoading(true);
    try {
      if (facture) {
        await dispatch(
          updateFacture({ id: facture._id, data: dataToSend })
        ).unwrap();
        toast.success("Facture modifiée avec succès");
      } else {
        await dispatch(createFacture(dataToSend)).unwrap();
        toast.success("Facture créée avec succès");
      }
      onClose();
      resetForm();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'enregistrement de la facture");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const canEdit = ["admin", "doctor"].includes(user?.role);

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <h2>{facture ? "Modifier la facture" : "Nouvelle facture"}</h2>
          <button className={styles["close-btn"]} onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Patient */}
          <div className={styles["form-group"]}>
            <label>Patient *</label>
            <select
              value={formData.patientId}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
              required
              disabled={!canEdit || !!preSelectedPatientId}
            >
              <option value="">Sélectionner un patient</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {getPatientDisplayName(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className={styles["form-group"]}>
            <label>Date de facturation *</label>
            <input
              type="date"
              value={formData.dateFacture}
              onChange={(e) =>
                setFormData({ ...formData, dateFacture: e.target.value })
              }
              required
              disabled={!canEdit}
            />
          </div>

          {/* Analyses */}
          <div className={styles["form-group"]}>
            <label>Ajouter une analyse</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={selectedAnalyse}
                onChange={(e) => setSelectedAnalyse(e.target.value)}
                style={{ flex: 1 }}
                disabled={!canEdit}
              >
                <option value="">Sélectionner une analyse</option>
                {analyses.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.nom} - {a.prix} DH
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddAnalyse}
                className={styles["btn-secondary"]}
                disabled={!canEdit}
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Selected Analyses */}
          {selectedAnalyses.length > 0 && (
            <div className={styles["analyses-list"]}>
              <table>
                <thead>
                  <tr>
                    <th>Analyse</th>
                    <th>Prix</th>
                    <th>Quantité</th>
                    <th>Sous-total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAnalyses.map((a) => (
                    <tr key={a.analyseId}>
                      <td>{a.nom}</td>
                      <td>{a.prix}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={a.quantite}
                          onChange={(e) =>
                            handleQuantiteChange(a.analyseId, e.target.value)
                          }
                          disabled={!canEdit}
                        />
                      </td>
                      <td>{a.prix * a.quantite}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveAnalyse(a.analyseId)}
                          className={styles["btn-danger"]}
                          disabled={!canEdit}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Montants */}
          <div className={styles["form-group"]}>
            <label>Montant total</label>
            <input type="number" value={formData.montantTotal} readOnly />
          </div>
          <div className={styles["form-group"]}>
            <label>Montant payé</label>
            <input
              type="number"
              value={formData.montantPaye}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  montantPaye: Math.min(
                    parseFloat(e.target.value) || 0,
                    formData.montantTotal
                  ),
                })
              }
              min="0"
              max={formData.montantTotal}
              disabled={!canEdit}
            />
          </div>
          <div className={styles["form-group"]}>
            <label>Statut</label>
            <select
              value={formData.statut}
              onChange={(e) =>
                setFormData({ ...formData, statut: e.target.value })
              }
              disabled={!canEdit}
            >
              <option value="En attente">En attente</option>
              <option value="Payée">Payée</option>
              <option value="Partiellement payée">Partiellement payée</option>
            </select>
          </div>

          {!canEdit && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>
              Vous n'avez pas la permission de créer ou modifier cette facture
            </p>
          )}

          <div className={styles["modal-footer"]}>
            <button
              type="button"
              onClick={onClose}
              className={styles["btn-secondary"]}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles["btn-primary"]}
              disabled={loading || !canEdit}
            >
              {loading ? "En cours..." : facture ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FactureModal;
