import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFactures, deleteFacture } from "./facturesSlice";
import InvoiceCard from "./components/InvoiceCard";
import FactureModal from "./FactureModal";
import EmptyState from "../shared/EmptyState";
import LoadingSpinner from "../shared/LoadingSpinner";
import { toast } from "react-toastify";
import styles from "./InvoiceSection.module.css";

const InvoiceSection = ({ patientId }) => {
  console.log("🚀 InvoiceSection render, patientId:", patientId);

  const dispatch = useDispatch();
  const { factures, loading } = useSelector((state) => state.factures);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  console.log("📊 State:", { isModalOpen, factures: factures.length });

  // Filter invoices for this patient
  const patientInvoices = factures.filter(
    (f) => f.patientId?._id === patientId || f.patientId === patientId
  );

  useEffect(() => {
    console.log("📥 Fetching factures...");
    if (factures.length === 0) {
      dispatch(fetchFactures());
    }
  }, [dispatch, factures.length]);

  const handleAddNew = () => {
    console.log("🆕 handleAddNew CALLED!");
    setSelectedInvoice(null);
    setIsModalOpen(true);
    console.log("✅ Modal should be open now");
  };

  const handleEdit = (invoice) => {
    console.log("✏️ handleEdit:", invoice._id);
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      try {
        await dispatch(deleteFacture(id)).unwrap();
        toast.success("Facture supprimée avec succès");
      } catch (err) {
        toast.error(err || "Erreur lors de la suppression");
      }
    }
  };

  const handleFormClose = () => {
    console.log("🔒 handleFormClose CALLED");
    setIsModalOpen(false);
    setSelectedInvoice(null);
    dispatch(fetchFactures());
  };

  if (loading && factures.length === 0) {
    return <LoadingSpinner message="Chargement des factures..." />;
  }

  console.log("🎨 Rendering with isModalOpen:", isModalOpen);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>💰 Facturation</h2>
        <button
          className={styles.btnAdd}
          onClick={handleAddNew}
          type="button"
          style={{ cursor: "pointer" }}
        >
          ➕ Nouvelle Facture
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Factures</span>
          <span className={styles.summaryValue}>{patientInvoices.length}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total à Payer</span>
          <span className={styles.summaryValue}>
            {patientInvoices
              .reduce((sum, inv) => sum + (inv.montantTotal || 0), 0)
              .toFixed(2)}{" "}
            DH
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Payé</span>
          <span className={styles.summaryValue}>
            {patientInvoices
              .reduce((sum, inv) => sum + (inv.montantPaye || 0), 0)
              .toFixed(2)}{" "}
            DH
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Reste à Payer</span>
          <span className={styles.summaryValue}>
            {patientInvoices
              .reduce(
                (sum, inv) =>
                  sum + ((inv.montantTotal || 0) - (inv.montantPaye || 0)),
                0
              )
              .toFixed(2)}{" "}
            DH
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {patientInvoices.length === 0 ? (
          <EmptyState
            icon="💰"
            message="Aucune facture enregistrée"
            action={{
              label: "Créer une facture",
              onClick: handleAddNew,
            }}
          />
        ) : (
          patientInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice._id}
              invoice={invoice}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modal - TOUJOURS rendu */}
      {console.log("🎭 Rendering FactureModal with isOpen:", isModalOpen)}
      <FactureModal
        isOpen={isModalOpen}
        facture={selectedInvoice}
        preSelectedPatientId={patientId}
        onClose={handleFormClose}
      />
    </div>
  );
};

export default InvoiceSection;
