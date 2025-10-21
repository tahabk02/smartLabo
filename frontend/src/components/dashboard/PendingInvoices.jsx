import { FiDollarSign, FiClock, FiAlertCircle } from "react-icons/fi";
import styles from "./Dashboard.module.css";

const PendingInvoices = ({ invoices = [] }) => {
  const defaultInvoices = [
    {
      id: 1,
      invoiceNumber: "INV-001",
      patient: "John Doe",
      amount: 250,
      dueDate: "2024-01-15",
      status: "pending",
      daysOverdue: 0,
    },
    {
      id: 2,
      invoiceNumber: "INV-002",
      patient: "Jane Smith",
      amount: 180,
      dueDate: "2024-01-10",
      status: "overdue",
      daysOverdue: 5,
    },
    {
      id: 3,
      invoiceNumber: "INV-003",
      patient: "Mike Johnson",
      amount: 320,
      dueDate: "2024-01-20",
      status: "pending",
      daysOverdue: 0,
    },
    {
      id: 4,
      invoiceNumber: "INV-004",
      patient: "Sarah Williams",
      amount: 150,
      dueDate: "2024-01-08",
      status: "overdue",
      daysOverdue: 7,
    },
  ];

  const displayInvoices = invoices.length > 0 ? invoices : defaultInvoices;

  const totalPending = displayInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0
  );

  return (
    <div className={styles["card"]}>
      <div className={styles["card-header"]}>
        <h2>Pending Invoices</h2>
        <div className={styles["total-pending"]}>
          <FiDollarSign />${totalPending}
        </div>
      </div>
      <div className={styles["invoices-list"]}>
        {displayInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className={`invoice-item invoice-${invoice.status}`}
          >
            <div className={styles["invoice-header"]}>
              <div className={styles["invoice-number"]}>
                <FiDollarSign size={14} />
                {invoice.invoiceNumber}
              </div>
              <span className={`invoice-status status-${invoice.status}`}>
                {invoice.status}
              </span>
            </div>
            <div className={styles["invoice-details"]}>
              <p className={styles["invoice-patient"]}>{invoice.patient}</p>
              <div className={styles["invoice-meta"]}>
                <span className={styles["invoice-amount"]}>
                  ${invoice.amount}
                </span>
                <span className={styles["invoice-due"]}>
                  <FiClock size={12} />
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </span>
              </div>
              {invoice.status === "overdue" && (
                <div className={styles["overdue-alert"]}>
                  <FiAlertCircle size={12} />
                  {invoice.daysOverdue} days overdue
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className={styles["card-footer"]}>
        <button className={styles["btn-link"]}>View All Invoices</button>
      </div>
    </div>
  );
};

export default PendingInvoices;
