import styles from "./ConversationMonitor.module.css";
import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  User,
  Clock,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";

const ConversationMonitor = () => {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "http://localhost:5000/api/chatbot/conversations"
      );
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        setFilteredConversations(data.data);
      } else {
        setError("Erreur lors du chargement des conversations");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des conversations :", err);
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...conversations];
    if (statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (conv.patientId?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (conv.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredConversations(filtered);
  }, [conversations, statusFilter, searchTerm]);

  const getStatusColor = (status) => {
    const colors = {
      active: {
        bg: "rgba(16, 185, 129, 0.1)",
        color: "#059669",
        border: "rgba(16, 185, 129, 0.3)",
      },
      completed: {
        bg: "rgba(59, 130, 246, 0.1)",
        color: "#2563eb",
        border: "rgba(59, 130, 246, 0.3)",
      },
      pending: {
        bg: "rgba(245, 158, 11, 0.1)",
        color: "#d97706",
        border: "rgba(245, 158, 11, 0.3)",
      },
      archived: {
        bg: "rgba(107, 114, 128, 0.1)",
        color: "#4b5563",
        border: "rgba(107, 114, 128, 0.3)",
      },
    };
    return colors[status] || colors.archived;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle size={14} />;
      case "completed":
        return <CheckCircle size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "archived":
        return <XCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatsByStatus = () => {
    const stats = {
      all: conversations.length,
      active: 0,
      completed: 0,
      pending: 0,
      archived: 0,
    };
    conversations.forEach((conv) => {
      if (stats.hasOwnProperty(conv.status)) stats[conv.status]++;
    });
    return stats;
  };

  const exportToCSV = () => {
    const headers = ["ID", "Patient", "Status", "Date", "Résumé"];
    const rows = filteredConversations.map((conv) => [
      conv._id,
      conv.patientId?.name || "Anonyme",
      conv.status,
      formatDate(conv.createdAt),
      conv.summary || "Aucun",
    ]);
    let csvContent = headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conversations_${new Date().getTime()}.csv`;
    link.click();
  };

  const stats = getStatsByStatus();

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1024px) {
          .conv-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .conv-container { padding: 1.5rem !important; }
          .conv-header { flex-direction: column !important; text-align: center !important; }
          .filter-buttons { flex-direction: column !important; width: 100% !important; }
          .filter-buttons button { width: 100% !important; }
        }
        @media (max-width: 640px) {
          .conv-container { padding: 1rem !important; }
        }
      `}</style>

      {/* Header */}
      <div
        className={styles["conv-header"]}
        style={{
          background: "linear-gradient(135deg, #4f46e5, #9333ea)",
          borderRadius: "20px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          padding: "2rem",
          marginBottom: "2rem",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessageCircle size={32} />
          </div>
          <div>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                margin: "0 0 0.5rem 0",
              }}
            >
              Historique des Conversations
            </h2>
            <p style={{ fontSize: "1rem", margin: "0", opacity: "0.95" }}>
              Gérez et consultez toutes vos conversations
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={exportToCSV}
            disabled={filteredConversations.length === 0}
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              cursor:
                filteredConversations.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
              opacity: filteredConversations.length === 0 ? "0.5" : "1",
            }}
            title="Exporter en CSV"
            onMouseEnter={(e) => {
              if (filteredConversations.length > 0) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Download size={24} />
          </button>
          <button
            onClick={fetchConversations}
            style={{
              width: "48px",
              height: "48px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
            title="Actualiser"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <RefreshCw
              size={24}
              style={{
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      {!loading && !error && conversations.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div style={{ flex: "1", minWidth: "250px" }}>
              <input
                type="text"
                placeholder="Rechercher par ID, patient ou résumé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "all 0.3s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4f46e5";
                  e.target.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <div
              className={styles["filter-buttons"]}
              style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
            >
              {[
                { key: "all", label: "Tous", color: "#4f46e5" },
                { key: "active", label: "Actif", color: "#10b981" },
                { key: "completed", label: "Terminé", color: "#3b82f6" },
                { key: "pending", label: "En attente", color: "#f59e0b" },
                { key: "archived", label: "Archivé", color: "#6b7280" },
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "2px solid",
                    borderColor: statusFilter === key ? color : "#e5e7eb",
                    background: statusFilter === key ? color : "white",
                    color: statusFilter === key ? "white" : "#6b7280",
                    borderRadius: "12px",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {label} ({stats[key]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4rem 2rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              border: "4px solid #e5e7eb",
              borderTopColor: "#4f46e5",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "1rem",
            }}
          ></div>
          <p
            style={{
              color: "#6b7280",
              fontWeight: "600",
              fontSize: "1rem",
              margin: "0",
            }}
          >
            Chargement des conversations...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "2px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(239, 68, 68, 0.2)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ef4444",
                flexShrink: "0",
              }}
            >
              <AlertCircle size={24} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: "700",
                  color: "#991b1b",
                  margin: "0 0 0.25rem 0",
                }}
              >
                Erreur
              </h3>
              <p
                style={{ fontSize: "0.875rem", color: "#b91c1c", margin: "0" }}
              >
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredConversations.length === 0 && (
        <div
          style={{
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              background: "#f9fafb",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              color: "#9ca3af",
            }}
          >
            <MessageCircle size={48} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#1f2937",
              margin: "0 0 0.5rem 0",
            }}
          >
            {searchTerm || statusFilter !== "all"
              ? "Aucun résultat"
              : "Aucune conversation"}
          </h3>
          <p style={{ fontSize: "1rem", color: "#6b7280", margin: "0" }}>
            {searchTerm || statusFilter !== "all"
              ? "Essayez de modifier vos filtres de recherche"
              : "Les conversations apparaîtront ici une fois créées"}
          </p>
        </div>
      )}

      {/* Conversations Grid */}
      {!loading && !error && filteredConversations.length > 0 && (
        <div
          className={styles["conv-grid"]}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {filteredConversations.map((conv) => {
            const statusStyle = getStatusColor(conv.status);
            return (
              <div
                key={conv._id}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.3)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(147, 51, 234, 0.05))",
                    padding: "1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "rgba(79, 70, 229, 0.1)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#4f46e5",
                        }}
                      >
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            fontWeight: "600",
                            margin: "0 0 0.25rem 0",
                            textTransform: "uppercase",
                          }}
                        >
                          Conversation ID
                        </p>
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                            fontWeight: "700",
                            color: "#1f2937",
                            margin: "0",
                          }}
                        >
                          {conv._id.substring(0, 12)}...
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "0.375rem 0.875rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {getStatusIcon(conv.status)}
                      {conv.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {/* Patient Info */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.875rem",
                      background: "#f9fafb",
                      borderRadius: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "white",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                        color: "#4f46e5",
                      }}
                    >
                      <User size={18} />
                    </div>
                    <div style={{ flex: "1" }}>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#9ca3af",
                          fontWeight: "600",
                          margin: "0 0 0.125rem 0",
                          textTransform: "uppercase",
                        }}
                      >
                        Patient
                      </p>
                      <p
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: "700",
                          color: "#1f2937",
                          margin: "0",
                        }}
                      >
                        {conv.patientId?.name || "Anonyme"}
                      </p>
                    </div>
                  </div>

                  {/* Date Info */}
                  {conv.createdAt && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.875rem",
                        background: "#f9fafb",
                        borderRadius: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          background: "white",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                          color: "#9333ea",
                        }}
                      >
                        <Clock size={18} />
                      </div>
                      <div style={{ flex: "1" }}>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            fontWeight: "600",
                            margin: "0 0 0.125rem 0",
                            textTransform: "uppercase",
                          }}
                        >
                          Date de création
                        </p>
                        <p
                          style={{
                            fontSize: "0.9375rem",
                            fontWeight: "700",
                            color: "#1f2937",
                            margin: "0",
                          }}
                        >
                          {formatDate(conv.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {conv.summary ? (
                    <div
                      style={{
                        padding: "1rem",
                        background:
                          "linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(147, 51, 234, 0.05))",
                        borderRadius: "12px",
                        border: "1px solid rgba(79, 70, 229, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                        }}
                      >
                        <FileText
                          size={18}
                          style={{
                            color: "#4f46e5",
                            flexShrink: "0",
                            marginTop: "2px",
                          }}
                        />
                        <div style={{ flex: "1" }}>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#4f46e5",
                              fontWeight: "700",
                              margin: "0 0 0.375rem 0",
                              textTransform: "uppercase",
                            }}
                          >
                            RÉSUMÉ
                          </p>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "#1f2937",
                              lineHeight: "1.6",
                              margin: "0",
                            }}
                          >
                            {conv.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "1rem",
                        background: "#f9fafb",
                        borderRadius: "12px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "#9ca3af",
                          fontStyle: "italic",
                          margin: "0",
                        }}
                      >
                        Aucun résumé disponible
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "1.25rem 1.5rem",
                    borderTop: "1px solid #e5e7eb",
                  }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "0.75rem 1.5rem",
                      background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      fontWeight: "600",
                      fontSize: "0.9375rem",
                      cursor: "pointer",
                      transition: "all 0.3s",
                      boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 16px rgba(79, 70, 229, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(79, 70, 229, 0.3)";
                    }}
                  >
                    Voir les détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      {!loading && !error && conversations.length > 0 && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(147, 51, 234, 0.05))",
            border: "1px solid rgba(79, 70, 229, 0.1)",
            borderRadius: "16px",
            padding: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#6b7280",
                margin: "0 0 0.25rem 0",
              }}
            >
              {statusFilter === "all"
                ? "Total des conversations"
                : `Conversations ${statusFilter}`}
            </p>
            <p
              style={{
                fontSize: "2rem",
                fontWeight: "700",
                color: "#4f46e5",
                margin: "0",
              }}
            >
              {filteredConversations.length}
            </p>
          </div>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "white",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              color: "#4f46e5",
            }}
          >
            <MessageCircle size={32} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationMonitor;
