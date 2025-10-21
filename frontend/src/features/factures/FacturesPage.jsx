import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFactures, deleteFacture, setFilters } from "./facturesSlice";
import FactureModal from "./FactureModal";
import Loader from "../../components/Loader";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDollarSign,
} from "react-icons/fi";
import { toast } from "react-toastify";
import styles from "./Factures.module.css";

const FacturesPage = () => {
  const dispatch = useDispatch();
  const { factures, loading, error, filters } = useSelector(
    (state) => state.factures
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);

  useEffect(() => {
    dispatch(fetchFactures());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous supprimer cette facture ?")) {
      try {
        await dispatch(deleteFacture(id)).unwrap();
        toast.success("Facture supprimée avec succès");
      } catch (err) {
        toast.error(err.message || "Erreur lors de la suppression");
      }
    }
  };

  const handleEdit = (facture) => {
    setSelectedFacture(facture);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedFacture(null);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => dispatch(setFilters({ search: e.target.value }));
  const handleStatusFilter = (e) =>
    dispatch(setFilters({ paymentStatus: e.target.value }));

  const filteredFactures = factures.filter((f) => {
    const search = filters.search?.toLowerCase() || "";
    const status = filters.paymentStatus || "all";

    const matchesSearch =
      f.patient?.nom?.toLowerCase().includes(search) ||
      f.patient?.prenom?.toLowerCase().includes(search) ||
      f.numeroFacture?.toLowerCase().includes(search);

    const matchesStatus =
      status === "all" || f.statut?.toLowerCase() === status;

    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filteredFactures.reduce(
    (sum, f) => sum + (f.montantTotal || 0),
    0
  );

  if (loading && factures.length === 0) return <Loader fullscreen />;

  return (
    <div className={styles["factures-page"]}>
      <div className={styles["page-header"]}>
        <h1>Gestion des Factures</h1>
        <button
          onClick={handleAdd}
          className={styles["btn"] + " " + styles["btn-primary"]}
        >
          <FiPlus /> Créer Facture
        </button>
      </div>

      <div className={styles["filters-row"]}>
        <div className={styles["search-box"]}>
          <FiSearch />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
        <select value={filters.paymentStatus} onChange={handleStatusFilter}>
          <option value="all">Tous</option>
          <option value="en attente">En attente</option>
          <option value="payée">Payée</option>
          <option value="partiellement payée">Partiellement payée</option>
        </select>
      </div>

      <div className={styles["table-container"]}>
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Total</th>
              <th>Montant payé</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  Aucune facture trouvée
                </td>
              </tr>
            ) : (
              filteredFactures.map((f) => (
                <tr key={f._id}>
                  <td>
                    {f.patient?.nom} {f.patient?.prenom}
                  </td>
                  <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td>{f.montantTotal} MAD</td>
                  <td>{f.montantPaye} MAD</td>
                  <td>{f.statut}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(f)}
                      className={styles["btn-icon"]}
                      title="Modifier"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(f._id)}
                      className={
                        styles["btn-icon"] + " " + styles["btn-danger"]
                      }
                      title="Supprimer"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles["summary-cards"]}>
        <div className={styles["summary-card"] + " " + styles["total"]}>
          <FiDollarSign />
          <div>
            <h3>{totalRevenue.toFixed(2)} MAD</h3>
            <p>Revenue total</p>
          </div>
        </div>
      </div>

      {/* 🔧 FIX: Ajout de isOpen={isModalOpen} */}
      <FactureModal
        isOpen={isModalOpen}
        facture={selectedFacture}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFacture(null);
          dispatch(fetchFactures());
        }}
      />
    </div>
  );
};

export default FacturesPage;
