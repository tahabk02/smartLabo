import styles from "./AnalysesPage.module.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAnalyses,
  createAnalysis,
  updateAnalysis,
  deleteAnalysis,
  toggleAnalysisStatus,
} from "./analysesSlice";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
} from "react-icons/fi";

const AnalysesPage = () => {
  const dispatch = useDispatch();
  const { analyses, loading, error } = useSelector((state) => state.analyses);
  const [showModal, setShowModal] = useState(false);
  const [editingAnalyse, setEditingAnalyse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "Biochemistry",
    price: "",
    description: "",
    normalRange: "",
    turnaroundTime: "24 hours",
  });

  useEffect(() => {
    dispatch(fetchAnalyses());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnalyse) {
        await dispatch(
          updateAnalysis({ id: editingAnalyse._id, data: formData })
        ).unwrap();
        toast.success("Analyse modifiée avec succès");
      } else {
        await dispatch(createAnalysis(formData)).unwrap();
        toast.success("Analyse créée avec succès");
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err || "Une erreur est survenue");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette analyse ?")) {
      try {
        await dispatch(deleteAnalysis(id)).unwrap();
        toast.success("Analyse supprimée avec succès");
      } catch (err) {
        toast.error(err || "Erreur lors de la suppression");
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await dispatch(toggleAnalysisStatus(id)).unwrap();
      toast.success("Statut modifié avec succès");
    } catch (err) {
      toast.error(err || "Erreur lors de la modification du statut");
    }
  };

  const handleEdit = (analyse) => {
    setEditingAnalyse(analyse);
    setFormData({
      name: analyse.name,
      code: analyse.code,
      category: analyse.category,
      price: analyse.price,
      description: analyse.description || "",
      normalRange: analyse.normalRange || "",
      turnaroundTime: analyse.turnaroundTime || "24 hours",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnalyse(null);
    setFormData({
      name: "",
      code: "",
      category: "Biochemistry",
      price: "",
      description: "",
      normalRange: "",
      turnaroundTime: "24 hours",
    });
  };

  // Filter analyses
  const filteredAnalyses = analyses.filter((analyse) => {
    const matchesSearch =
      (analyse.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (analyse.code?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (analyse.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );
    const matchesCategory =
      categoryFilter === "all" || analyse.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading && analyses.length === 0) {
    return (
      <div className={styles["loading-container"]}>
        <div className={styles["spinner"]}></div>
        <p>Chargement des analyses...</p>
      </div>
    );
  }

  return (
    <div className={styles["analyses-page"]}>
      <div className={styles["page-header"]}>
        <h1>Gestion des Analyses</h1>
        <button
          className={styles["btn"] + " " + styles["btn-primary"]}
          onClick={() => setShowModal(true)}
        >
          <FiPlus /> Nouvelle Analyse
        </button>
      </div>

      <div className={styles["card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <FiSearch />
            <input
              type="text"
              placeholder="Rechercher par nom ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            <option value="Hematology">Hématologie</option>
            <option value="Biochemistry">Biochimie</option>
            <option value="Microbiology">Microbiologie</option>
            <option value="Immunology">Immunologie</option>
            <option value="Radiology">Radiologie</option>
            <option value="Clinical Pathology">Pathologie Clinique</option>
            <option value="Endocrinology">Endocrinologie</option>
          </select>
        </div>

        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Délai</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnalyses.length === 0 ? (
                <tr key="no-analyses">
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    Aucune analyse trouvée
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map((analyse) => (
                  <tr key={analyse._id}>
                    <td>
                      <span className={styles["code-badge"]}>
                        {analyse.code}
                      </span>
                    </td>
                    <td>
                      <div className={styles["analysis-info"]}>
                        <strong>{analyse.name}</strong>
                        {analyse.description && (
                          <small>{analyse.description}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`category-badge ${analyse.category}`}>
                        {analyse.category}
                      </span>
                    </td>
                    <td>
                      <strong>{analyse.price} MAD</strong>
                    </td>
                    <td>{analyse.turnaroundTime}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          analyse.isActive ? "active" : "inactive"
                        }`}
                      >
                        {analyse.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className={styles["action-buttons"]}>
                        <button
                          onClick={() => handleToggleStatus(analyse._id)}
                          className={styles["btn-icon"]}
                          title={analyse.isActive ? "Désactiver" : "Activer"}
                        >
                          {analyse.isActive ? (
                            <FiToggleRight />
                          ) : (
                            <FiToggleLeft />
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(analyse)}
                          className={styles["btn-icon"]}
                          title="Modifier"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(analyse._id)}
                          className={
                            styles["btn-icon"] + " " + styles["btn-danger"]
                          }
                          title="Supprimer"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles["modal-overlay"]} onClick={handleCloseModal}>
          <div
            className={styles["modal-content"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["modal-header"]}>
              <h2>
                {editingAnalyse ? "Modifier l'analyse" : "Nouvelle analyse"}
              </h2>
              <button
                className={styles["close-btn"]}
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles["analyse-form"]}>
              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Nom de l'analyse *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Ex: Hémogramme complet"
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label>Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                    placeholder="Ex: HEM001"
                    disabled={!!editingAnalyse}
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description de l'analyse"
                  rows="3"
                />
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Catégorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    required
                  >
                    <option value="Hematology">Hématologie</option>
                    <option value="Biochemistry">Biochimie</option>
                    <option value="Microbiology">Microbiologie</option>
                    <option value="Immunology">Immunologie</option>
                    <option value="Radiology">Radiologie</option>
                    <option value="Clinical Pathology">
                      Pathologie Clinique
                    </option>
                    <option value="Endocrinology">Endocrinologie</option>
                  </select>
                </div>

                <div className={styles["form-group"]}>
                  <label>Prix (MAD) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles["form-row"]}>
                <div className={styles["form-group"]}>
                  <label>Valeur normale</label>
                  <input
                    type="text"
                    value={formData.normalRange}
                    onChange={(e) =>
                      setFormData({ ...formData, normalRange: e.target.value })
                    }
                    placeholder="Ex: 4-11 g/dL"
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label>Délai de traitement</label>
                  <input
                    type="text"
                    value={formData.turnaroundTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        turnaroundTime: e.target.value,
                      })
                    }
                    placeholder="Ex: 24 hours, 2-3 days"
                  />
                </div>
              </div>

              <div className={styles["form-actions"]}>
                <button
                  type="button"
                  className={styles["btn"] + " " + styles["btn-secondary"]}
                  onClick={handleCloseModal}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={styles["btn"] + " " + styles["btn-primary"]}
                >
                  {editingAnalyse ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysesPage;
