// frontend/src/features/patients/components/InvoicesView.jsx
// VERSION AMÉLIORÉE avec codes de paiement et PDF

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Filter,
  Download,
  FileText,
  Receipt,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  TrendingUp,
  X,
  Smartphone,
  Building,
  CreditCard,
  Copy,
  Check,
  Wallet,
} from "lucide-react";
import styles from "./InvoicesView.module.css";

const InvoicesView = () => {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const response = await fetch(
        "http://localhost:5000/api/patient/invoices",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Format de données invalide");
      }

      setInvoices(data);

      if (isRefresh) {
        showNotification("✅ Factures actualisées", "success");
      }
    } catch (error) {
      console.error("❌ Erreur chargement factures:", error);
      setError(error.message);
      showNotification("❌ " + error.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setDownloadingId(invoiceId);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification("✅ Facture téléchargée avec succès", "success");
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      showNotification("❌ Erreur lors du téléchargement", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePaymentMethodSelection = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setShowPaymentModal(true);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.appointmentId
        ?.toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === "all" || invoice.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const toggleInvoiceExpansion = (invoiceId) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  const showNotification = (message, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Remplacer par react-toastify en production
  };

  const getStatusConfig = (status) => {
    const config = {
      paid: {
        label: "Payée",
        color: styles.statusPaid,
        icon: CheckCircle,
        bgColor: "#10b981",
      },
      pending: {
        label: "En attente",
        color: styles.statusPending,
        icon: Clock,
        bgColor: "#f59e0b",
      },
      overdue: {
        label: "En retard",
        color: styles.statusOverdue,
        icon: AlertCircle,
        bgColor: "#ef4444",
      },
      cancelled: {
        label: "Annulée",
        color: styles.statusCancelled,
        icon: X,
        bgColor: "#6b7280",
      },
    };
    return (
      config[status] || {
        label: status,
        color: styles.statusPending,
        icon: Clock,
        bgColor: "#9ca3af",
      }
    );
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
    paidAmount: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0),
    pendingAmount: invoices
      .filter((i) => i.status === "pending")
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
        <p className={styles.loadingText}>Chargement de vos factures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h3 className={styles.errorTitle}>Erreur de chargement</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={() => fetchInvoices()} className={styles.retryButton}>
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={styles.invoicesContainer}>
      {/* En-tête */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <div className={styles.iconWrapper}>
              <Receipt className={styles.headerIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Mes Factures</h1>
              <p className={styles.subtitle}>
                Consultez et gérez toutes vos factures en un seul endroit
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchInvoices(true)}
            disabled={refreshing}
            className={styles.refreshButton}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Actualisation..." : "Actualiser"}
          </button>
        </div>

        {/* Statistiques */}
        <div className={styles.statsGrid}>
          <StatCard
            icon={FileText}
            value={stats.total}
            label="Total Factures"
            color="#3b82f6"
          />
          <StatCard
            icon={CheckCircle}
            value={stats.paid}
            label="Payées"
            amount={`${stats.paidAmount.toFixed(2)} MAD`}
            color="#10b981"
          />
          <StatCard
            icon={Clock}
            value={stats.pending}
            label="En Attente"
            amount={`${stats.pendingAmount.toFixed(2)} MAD`}
            color="#f59e0b"
          />
          <StatCard
            icon={TrendingUp}
            value={stats.totalAmount.toFixed(0)}
            label="Total MAD"
            amount="Toutes factures"
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className={styles.controlsSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Rechercher par numéro de facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className={styles.clearSearch}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={styles.filters}>
          <Filter className={styles.filterIcon} />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="all">Tous ({invoices.length})</option>
            <option value="paid">Payées ({stats.paid})</option>
            <option value="pending">En attente ({stats.pending})</option>
            <option value="overdue">En retard ({stats.overdue})</option>
          </select>
        </div>
      </div>

      {/* Liste des factures */}
      <div className={styles.invoicesList}>
        {filteredInvoices.length === 0 ? (
          <EmptyState
            searchTerm={searchTerm}
            selectedStatus={selectedStatus}
            hasInvoices={invoices.length > 0}
            onReset={() => {
              setSearchTerm("");
              setSelectedStatus("all");
            }}
          />
        ) : (
          filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice._id}
              invoice={invoice}
              isExpanded={expandedInvoice === invoice._id}
              onToggle={() => toggleInvoiceExpansion(invoice._id)}
              onDownload={() =>
                downloadInvoice(invoice._id, invoice.invoiceNumber)
              }
              onSelectPayment={() => handlePaymentMethodSelection(invoice)}
              downloading={downloadingId === invoice._id}
              getStatusConfig={getStatusConfig}
            />
          ))
        )}
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && selectedInvoiceForPayment && (
        <PaymentMethodModal
          invoice={selectedInvoiceForPayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSuccess={(updatedInvoice) => {
            setInvoices((prev) =>
              prev.map((inv) =>
                inv._id === updatedInvoice._id ? updatedInvoice : inv
              )
            );
            setShowPaymentModal(false);
            fetchInvoices(true);
          }}
        />
      )}
    </div>
  );
};

// Composant Carte de Statistique
const StatCard = ({ icon: Icon, value, label, amount, color }) => (
  <div className={styles.statCard}>
    <div className={styles.statIcon} style={{ backgroundColor: color }}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className={styles.statContent}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
      {amount && <div className={styles.statAmount}>{amount}</div>}
    </div>
  </div>
);

// Composant Carte de Facture
const InvoiceCard = ({
  invoice,
  isExpanded,
  onToggle,
  onDownload,
  onSelectPayment,
  downloading,
  getStatusConfig,
}) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className={`${styles.invoiceCard} ${
        isExpanded ? styles.invoiceCardExpanded : ""
      }`}
    >
      <div className={styles.invoiceHeader} onClick={onToggle}>
        <div className={styles.invoiceMainInfo}>
          <div className={styles.invoiceNumber}>
            <FileText className="w-5 h-5" />
            <span className={styles.invoiceNumberText}>
              {invoice.invoiceNumber || "N/A"}
            </span>
          </div>

          <div className={styles.invoiceMeta}>
            <div className={styles.invoiceDate}>
              <Calendar className="w-4 h-4" />
              <span>
                {invoice.issueDate
                  ? new Date(invoice.issueDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>

            <div className={styles.invoiceAmount}>
              <DollarSign className="w-4 h-4" />
              <span className={styles.amountValue}>
                {invoice.totalAmount ? invoice.totalAmount.toFixed(2) : "0.00"}{" "}
                MAD
              </span>
            </div>
          </div>
        </div>

        <div className={styles.invoiceActions}>
          <div
            className={`${styles.statusBadge} ${statusConfig.color}`}
            style={{
              backgroundColor: statusConfig.bgColor + "15",
              color: statusConfig.bgColor,
            }}
          >
            <StatusIcon className="w-4 h-4" />
            <span>{statusConfig.label}</span>
          </div>

          <button className={styles.expandButton}>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.invoiceDetails}>
          {/* Items */}
          {invoice.items && invoice.items.length > 0 && (
            <div className={styles.itemsSection}>
              <h4 className={styles.sectionTitle}>Détails:</h4>
              {invoice.items.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <span>{item.description || item.name}</span>
                  <span className={styles.itemPrice}>
                    {(item.total || item.price || 0).toFixed(2)} MAD
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Codes de paiement */}
          {invoice.codeAmana && (
            <PaymentCodeDisplay
              type="Amana"
              code={invoice.codeAmana}
              icon={Smartphone}
              instruction="Composez *555# et entrez ce code"
              copied={copiedCode === "amana"}
              onCopy={() => copyToClipboard(invoice.codeAmana, "amana")}
            />
          )}

          {invoice.codeCashPlus && (
            <PaymentCodeDisplay
              type="CashPlus"
              code={invoice.codeCashPlus}
              icon={Smartphone}
              instruction="Rendez-vous dans un point CashPlus"
              copied={copiedCode === "cashplus"}
              onCopy={() => copyToClipboard(invoice.codeCashPlus, "cashplus")}
            />
          )}

          {invoice.virementDetails && (
            <BankTransferDetails details={invoice.virementDetails} />
          )}

          {/* Actions */}
          <div className={styles.cardActions}>
            <button
              onClick={onDownload}
              disabled={downloading}
              className={styles.downloadButton}
            >
              {downloading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Télécharger PDF
            </button>

            {invoice.status === "pending" && !invoice.paymentMethod && (
              <button onClick={onSelectPayment} className={styles.payButton}>
                <Wallet className="w-4 h-4" />
                Choisir mode de paiement
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant Affichage Code de Paiement
const PaymentCodeDisplay = ({
  type,
  code,
  icon: Icon,
  instruction,
  copied,
  onCopy,
}) => (
  <div className={styles.paymentCodeSection}>
    <div className={styles.codeHeader}>
      <Icon className="w-4 h-4" style={{ color: "#10b981" }} />
      <span className={styles.codeLabel}>Code {type}</span>
    </div>
    <div className={styles.codeBox}>
      <code className={styles.code}>{code}</code>
      <button onClick={onCopy} className={styles.copyButton}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className={styles.codeInstruction}>{instruction}</div>
  </div>
);

// Composant Détails Virement
const BankTransferDetails = ({ details }) => (
  <div className={styles.virementSection}>
    <div className={styles.virementHeader}>
      <Building className="w-4 h-4" />
      <span>Virement bancaire</span>
    </div>
    <div className={styles.virementDetails}>
      <div className={styles.virementRow}>
        <span>Banque:</span>
        <strong>{details.banque}</strong>
      </div>
      <div className={styles.virementRow}>
        <span>RIB:</span>
        <strong>{details.rib}</strong>
      </div>
      <div className={styles.virementRow}>
        <span>Référence:</span>
        <strong>{details.reference}</strong>
      </div>
    </div>
  </div>
);

// Composant État Vide
const EmptyState = ({ searchTerm, selectedStatus, hasInvoices, onReset }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyStateIcon}>
      <FileText className="w-20 h-20" />
    </div>
    <h3 className={styles.emptyStateTitle}>Aucune facture trouvée</h3>
    <p className={styles.emptyStateText}>
      {hasInvoices
        ? "Aucune facture ne correspond à vos critères de recherche."
        : "Vous n'avez pas encore de factures."}
    </p>
    {(searchTerm || selectedStatus !== "all") && (
      <button onClick={onReset} className={styles.clearFiltersButton}>
        Réinitialiser les filtres
      </button>
    )}
  </div>
);

// Modal de Sélection du Mode de Paiement
const PaymentMethodModal = ({ invoice, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const paymentMethods = [
    { id: "amana", label: "Amana", icon: Smartphone, color: "#10b981" },
    { id: "cashplus", label: "CashPlus", icon: Smartphone, color: "#f59e0b" },
    { id: "virement", label: "Virement", icon: Building, color: "#3b82f6" },
    { id: "carte", label: "Carte", icon: CreditCard, color: "#8b5cf6" },
  ];

  const handleGenerateCode = async () => {
    if (!selectedMethod) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/invoices/${invoice._id}/generate-payment-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ paymentMethod: selectedMethod }),
        }
      );

      if (!response.ok) throw new Error("Erreur génération code");

      const result = await response.json();
      setPaymentData(result.data);

      // Mettre à jour la facture avec les nouvelles données
      onSuccess({
        ...invoice,
        paymentMethod: result.data.paymentMethod,
        codeAmana: result.data.codeAmana,
        codeCashPlus: result.data.codeCashPlus,
        virementDetails: result.data.virementDetails,
      });
    } catch (error) {
      console.error("Erreur:", error);
      alert("❌ Erreur lors de la génération du code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Choisir un mode de paiement</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.invoiceInfoBox}>
            <span>Facture: {invoice.invoiceNumber}</span>
            <strong>{invoice.totalAmount?.toFixed(2)} MAD</strong>
          </div>

          {!paymentData ? (
            <>
              <div className={styles.methodsGrid}>
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`${styles.methodCard} ${
                        selectedMethod === method.id
                          ? styles.methodSelected
                          : ""
                      }`}
                      style={{
                        borderColor:
                          selectedMethod === method.id
                            ? method.color
                            : "#e5e7eb",
                      }}
                    >
                      <Icon
                        className="w-8 h-8"
                        style={{ color: method.color }}
                      />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleGenerateCode}
                disabled={!selectedMethod || loading}
                className={styles.confirmButton}
              >
                {loading ? "Génération..." : "Générer le code"}
              </button>
            </>
          ) : (
            <div className={styles.successMessage}>
              <CheckCircle className="w-16 h-16" style={{ color: "#10b981" }} />
              <h4>Code généré avec succès!</h4>
              <p>
                Vous pouvez maintenant voir les détails de paiement dans votre
                facture.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesView;
