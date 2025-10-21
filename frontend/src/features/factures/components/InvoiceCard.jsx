import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { updateFacture } from "../facturesSlice";
import { FiEdit, FiTrash2, FiDollarSign } from "react-icons/fi";
import { toast } from "react-toastify";
import styles from "./InvoiceCard.module.css";

const InvoiceCard = ({ invoice, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const getPaymentStatus = () => {
    const total = invoice.montantTotal || 0;
    const paid = invoice.montantPaye || 0;

    if (paid >= total) {
      return { label: "Payé", color: "#28a745", icon: "✅" };
    } else if (paid > 0) {
      return { label: "Partiellement Payé", color: "#ffc107", icon: "⚠️" };
    } else {
      return { label: "Non Payé", color: "#dc3545", icon: "❌" };
    }
  };

  const status = getPaymentStatus();
  const remainingAmount =
    (invoice.montantTotal || 0) - (invoice.montantPaye || 0);

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (amount > 0 && amount <= remainingAmount) {
      try {
        const newPaidAmount = (invoice.montantPaye || 0) + amount;
        const newStatus =
          newPaidAmount >= invoice.montantTotal
            ? "Payée"
            : "Partiellement payée";

        await dispatch(
          updateFacture({
            id: invoice._id,
            data: {
              ...invoice,
              montantPaye: newPaidAmount,
              statut: newStatus,
            },
          })
        ).unwrap();

        toast.success("Paiement enregistré avec succès");
        setPaymentAmount("");
        setShowPaymentForm(false);
      } catch (err) {
        toast.error("Erreur lors de l'enregistrement du paiement");
      }
    } else {
      toast.error("Montant invalide");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.invoiceInfo}>
          <h3>Facture #{invoice.numeroFacture || invoice._id?.slice(-6)}</h3>
          <p className={styles.date}>
            {new Date(
              invoice.dateFacture || invoice.createdAt
            ).toLocaleDateString("fr-MA", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.btnEdit}
            onClick={() => onEdit(invoice)}
            title="Modifier"
          >
            <FiEdit />
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => onDelete(invoice._id)}
            title="Supprimer"
          >
            <FiTrash2 />
          </button>
        </div>
      </div>

      <div className={styles.cardBody}>
        <div
          className={styles.statusBadge}
          style={{ backgroundColor: status.color }}
        >
          {status.icon} {status.label}
        </div>

        {/* Items/Analyses List */}
        <div className={styles.itemsList}>
          <h4>📋 Analyses:</h4>
          {invoice.analyses?.map((item, index) => (
            <div key={index} className={styles.item}>
              <div className={styles.itemDesc}>
                <span>{item.nom}</span>
                <small>
                  Qté: {item.quantite} × {item.prix} DH
                </small>
              </div>
              <strong>{(item.quantite * item.prix).toFixed(2)} DH</strong>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className={styles.totals}>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <strong>Total:</strong>
            <strong>{(invoice.montantTotal || 0).toFixed(2)} DH</strong>
          </div>
        </div>

        {/* Payment Info */}
        <div className={styles.paymentInfo}>
          <div className={styles.paymentRow}>
            <span>💰 Payé:</span>
            <strong className={styles.paid}>
              {(invoice.montantPaye || 0).toFixed(2)} DH
            </strong>
          </div>
          <div className={styles.paymentRow}>
            <span>⏳ Reste:</span>
            <strong className={styles.remaining}>
              {remainingAmount.toFixed(2)} DH
            </strong>
          </div>
        </div>

        {/* Payment Form */}
        {remainingAmount > 0 && (
          <div className={styles.paymentSection}>
            {!showPaymentForm ? (
              <button
                className={styles.btnPayment}
                onClick={() => setShowPaymentForm(true)}
              >
                <FiDollarSign /> Enregistrer Paiement
              </button>
            ) : (
              <div className={styles.paymentForm}>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Montant (max: ${remainingAmount.toFixed(
                    2
                  )} DH)`}
                  max={remainingAmount}
                  step="0.01"
                  className={styles.paymentInput}
                />
                <div className={styles.paymentActions}>
                  <button className={styles.btnConfirm} onClick={handlePayment}>
                    Confirmer
                  </button>
                  <button
                    className={styles.btnCancelPayment}
                    onClick={() => {
                      setShowPaymentForm(false);
                      setPaymentAmount("");
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.createdBy}>📊 Statut: {invoice.statut}</span>
        <span className={styles.timestamp}>
          {new Date(invoice.createdAt).toLocaleDateString("fr-MA")}
        </span>
      </div>
    </div>
  );
};

export default InvoiceCard;
