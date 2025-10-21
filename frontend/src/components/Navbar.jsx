import { useSelector, useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";

const Navbar = ({ onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // États
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSearching, setIsSearching] = useState(false);

  // Refs
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);

  // Charger les notifications depuis localStorage
  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadNotifications = useCallback(() => {
    // Récupérer depuis localStorage ou créer des notifications mockées
    const storedNotifications = localStorage.getItem("userNotifications");

    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(
          parsed.map((n) => ({
            ...n,
            time: new Date(n.time),
          }))
        );
        return;
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
      }
    }

    // Notifications mockées par défaut
    const mockNotifications = [
      {
        id: Date.now(),
        type: "patients",
        icon: "👤",
        title: "Nouveau patient",
        message: "Ahmed Bennani a été ajouté au système",
        time: new Date(Date.now() - 5 * 60000),
        unread: true,
        color: "#3b82f6",
      },
      {
        id: Date.now() + 1,
        type: "invoice",
        icon: "💰",
        title: "Facture en attente",
        message: "Facture #1234 nécessite votre attention",
        time: new Date(Date.now() - 60 * 60000),
        unread: true,
        color: "#f59e0b",
      },
      {
        id: Date.now() + 2,
        type: "analyses",
        icon: "🔬",
        title: "Analyse terminée",
        message: "Résultats disponibles pour le test #567",
        time: new Date(Date.now() - 2 * 60 * 60000),
        unread: false,
        color: "#10b981",
      },
      {
        id: Date.now() + 3,
        type: "task",
        icon: "📋",
        title: "Tâche assignée",
        message: "Vérification des équipements de laboratoire",
        time: new Date(Date.now() - 3 * 60 * 60000),
        unread: false,
        color: "#8b5cf6",
      },
    ];

    setNotifications(mockNotifications);
    saveNotifications(mockNotifications);
  }, []);

  // Sauvegarder les notifications
  const saveNotifications = useCallback((notifs) => {
    try {
      localStorage.setItem("userNotifications", JSON.stringify(notifs));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notifications:", error);
    }
  }, []);

  // Gestion des clics en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K pour ouvrir la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      // Escape pour fermer tous les overlays
      if (e.key === "Escape") {
        setShowDropdown(false);
        setShowNotifications(false);
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Calculer le nombre de notifications non lues
  const unreadCount = notifications.filter((n) => n.unread).length;

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (notificationFilter === "unread") return notif.unread;
    if (notificationFilter === "read") return !notif.unread;
    return true;
  });

  // Gestion de la déconnexion
  const handleLogout = useCallback(() => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      dispatch(logout());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  // Gestion de la recherche
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();

      if (!searchQuery.trim()) {
        return;
      }

      setIsSearching(true);

      setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
        setShowSearch(false);
        setIsSearching(false);
      }, 300);
    },
    [searchQuery, navigate]
  );

  // Marquer une notification comme lue
  const markAsRead = useCallback(
    (notificationId) => {
      setNotifications((prev) => {
        const updated = prev.map((notif) =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        );
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((notif) => ({ ...notif, unread: false }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Supprimer une notification
  const deleteNotification = useCallback(
    (notificationId, e) => {
      e.stopPropagation();
      setNotifications((prev) => {
        const updated = prev.filter((notif) => notif.id !== notificationId);
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  // Effacer toutes les notifications
  const clearAllNotifications = useCallback(() => {
    if (window.confirm("Supprimer toutes les notifications ?")) {
      setNotifications([]);
      localStorage.removeItem("userNotifications");
    }
  }, []);

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = useCallback(() => {
    if (!user?.nom) return "U";
    const parts = `${user.nom} ${user.prenom || ""}`.trim().split(" ");
    return parts
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  // Couleurs des badges de rôle
  const getRoleBadgeColor = useCallback((role) => {
    const colors = {
      admin: "#ef4444",
      doctor: "#3b82f6",
      receptionist: "#10b981",
      lab_tech: "#f59e0b",
    };
    return colors[role] || "#6b7280";
  }, []);

  // Labels des rôles
  const getRoleLabel = useCallback((role) => {
    const labels = {
      admin: "Administrateur",
      doctor: "Médecin",
      receptionist: "Réceptionniste",
      lab_tech: "Technicien Lab",
    };
    return labels[role] || role;
  }, []);

  // Formater le temps écoulé
  const getTimeAgo = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  }, []);

  // Formater l'heure
  const formatTime = useCallback(() => {
    return currentTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [currentTime]);

  // Formater la date
  const formatDate = useCallback(() => {
    return currentTime.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [currentTime]);

  // Navigation rapide
  const handleQuickAction = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  // Toggle dropdowns avec fermeture des autres
  const toggleDropdown = useCallback(() => {
    setShowNotifications(false);
    setShowDropdown((prev) => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setShowDropdown(false);
    setShowNotifications((prev) => !prev);
  }, []);

  // Si non authentifié, ne rien afficher
  if (!isAuthenticated) return null;

  return (
    <>
      <nav
        className={styles["navbar-premium"]}
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Left Section */}
        <div className={styles["navbar-left"]}>
          <button
            className={styles["menu-toggle"]}
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            title="Ouvrir/Fermer le menu"
          >
            <span className={styles["hamburger"]}></span>
            <span className={styles["hamburger"]}></span>
            <span className={styles["hamburger"]}></span>
          </button>

          <div
            className={styles["navbar-brand"]}
            onClick={() => navigate("/")}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === "Enter" && navigate("/")}
            title="Retour à l'accueil"
          >
            <span className={styles["brand-icon"]}>🔬</span>
            <div className={styles["brand-text"]}>
              <span className={styles["brand-title"]}>SmartLabo</span>
              <span className={styles["brand-subtitle"]}>Lab Management</span>
            </div>
          </div>

          <div className={styles["search-container"]}>
            <div className={styles["search-icon"]}>🔍</div>
            <input
              type="text"
              placeholder="Rechercher... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
              className={styles["search-input"]}
              disabled={isSearching}
            />
            {searchQuery && (
              <button
                className={styles["search-clear"]}
                onClick={() => setSearchQuery("")}
                title="Effacer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Center Section */}
        <div className={styles["navbar-center"]}>
          <div className={styles["datetime-display"]}>
            <span className={styles["time"]}>{formatTime()}</span>
            <span className={styles["date"]}>{formatDate()}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className={styles["navbar-right"]}>
          <div className={styles["quick-actions"]}>
            <button
              className={styles["quick-btn"]}
              onClick={() => handleQuickAction("/patients/nouveau")}
              title="Nouveau patient"
            >
              <span className={styles["btn-icon"]}>👤</span>
              <span className={styles["btn-label"]}>Patient</span>
            </button>
            <button
              className={styles["quick-btn"]}
              onClick={() => handleQuickAction("/analyses/nouveau")}
              title="Nouvelle analyse"
            >
              <span className={styles["btn-icon"]}>🔬</span>
              <span className={styles["btn-label"]}>Analyse</span>
            </button>
          </div>

          {/* Notifications */}
          <div className={styles["nav-item"]} ref={notificationRef}>
            <button
              className={styles["nav-btn"]}
              onClick={toggleNotifications}
              title="Notifications"
            >
              <span className={styles["nav-icon"]}>🔔</span>
              {unreadCount > 0 && (
                <span className={styles["badge-count"]}>{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div
                className={
                  styles["dropdown-panel"] + " " + styles["notifications-panel"]
                }
              >
                <div className={styles["panel-header"]}>
                  <h3>Notifications</h3>
                  <div className={styles["header-actions"]}>
                    <button
                      className={styles["icon-btn"]}
                      onClick={markAllAsRead}
                      title="Tout marquer comme lu"
                      disabled={unreadCount === 0}
                    >
                      ✓
                    </button>
                    <button
                      className={styles["icon-btn"]}
                      onClick={loadNotifications}
                      title="Actualiser"
                    >
                      🔄
                    </button>
                    <button
                      className={styles["icon-btn"]}
                      onClick={clearAllNotifications}
                      title="Tout supprimer"
                      disabled={notifications.length === 0}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className={styles["notification-filters"]}>
                  <button
                    className={`filter-chip ${
                      notificationFilter === "all" ? "active" : ""
                    }`}
                    onClick={() => setNotificationFilter("all")}
                  >
                    Toutes ({notifications.length})
                  </button>
                  <button
                    className={`filter-chip ${
                      notificationFilter === "unread" ? "active" : ""
                    }`}
                    onClick={() => setNotificationFilter("unread")}
                  >
                    Non lues ({unreadCount})
                  </button>
                  <button
                    className={`filter-chip ${
                      notificationFilter === "read" ? "active" : ""
                    }`}
                    onClick={() => setNotificationFilter("read")}
                  >
                    Lues ({notifications.length - unreadCount})
                  </button>
                </div>

                <div className={styles["notifications-list"]}>
                  {filteredNotifications.length === 0 ? (
                    <div className={styles["empty-state"]}>
                      <span className={styles["empty-icon"]}>📭</span>
                      <p>
                        {notificationFilter === "all" && "Aucune notification"}
                        {notificationFilter === "unread" &&
                          "Aucune notification non lue"}
                        {notificationFilter === "read" &&
                          "Aucune notification lue"}
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notif-item ${notif.unread ? "unread" : ""}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div
                          className={styles["notif-icon"]}
                          style={{
                            background: `${notif.color}20`,
                            color: notif.color,
                          }}
                        >
                          {notif.icon}
                        </div>
                        <div className={styles["notif-content"]}>
                          <div className={styles["notif-title"]}>
                            {notif.title}
                          </div>
                          <div className={styles["notif-message"]}>
                            {notif.message}
                          </div>
                          <div className={styles["notif-time"]}>
                            {getTimeAgo(notif.time)}
                          </div>
                        </div>
                        {notif.unread && (
                          <div className={styles["unread-dot"]}></div>
                        )}
                        <button
                          className={styles["notif-delete"]}
                          onClick={(e) => deleteNotification(notif.id, e)}
                          title="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className={styles["nav-item"]} ref={dropdownRef}>
            <button
              className={`user-menu-btn ${showDropdown ? "active" : ""}`}
              onClick={toggleDropdown}
              title="Mon compte"
            >
              <div
                className={styles["user-avatar"]}
                style={{
                  background: `linear-gradient(135deg, ${getRoleBadgeColor(
                    user?.role
                  )}, ${getRoleBadgeColor(user?.role)}dd)`,
                }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={`Avatar de ${user.nom}`} />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className={styles["user-info"]}>
                <span className={styles["user-name"]}>
                  {user?.nom} {user?.prenom}
                </span>
                <span
                  className={styles["user-role"]}
                  style={{ color: getRoleBadgeColor(user?.role) }}
                >
                  {getRoleLabel(user?.role)}
                </span>
              </div>
              <span className={styles["dropdown-arrow"]}>▼</span>
            </button>

            {showDropdown && (
              <div
                className={
                  styles["dropdown-panel"] + " " + styles["user-panel"]
                }
              >
                <div className={styles["panel-user-header"]}>
                  <div
                    className={styles["avatar-large"]}
                    style={{
                      background: `linear-gradient(135deg, ${getRoleBadgeColor(
                        user?.role
                      )}, ${getRoleBadgeColor(user?.role)}dd)`,
                    }}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={`Avatar de ${user.nom}`} />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <div className={styles["user-details"]}>
                    <div className={styles["user-fullname"]}>
                      {user?.nom} {user?.prenom}
                    </div>
                    <div className={styles["user-email"]}>{user?.email}</div>
                    <span
                      className={styles["role-badge"]}
                      style={{ background: getRoleBadgeColor(user?.role) }}
                    >
                      {getRoleLabel(user?.role)}
                    </span>
                  </div>
                </div>

                <div className={styles["panel-divider"]}></div>

                <div className={styles["panel-menu"]}>
                  <button
                    className={styles["menu-item"]}
                    onClick={() => {
                      navigate("/profile");
                      setShowDropdown(false);
                    }}
                  >
                    <span className={styles["menu-icon"]}>👤</span>
                    <span>Mon Profil</span>
                  </button>
                  <button
                    className={styles["menu-item"]}
                    onClick={() => {
                      navigate("/parametres");
                      setShowDropdown(false);
                    }}
                  >
                    <span className={styles["menu-icon"]}>⚙️</span>
                    <span>Paramètres</span>
                  </button>
                  <button
                    className={styles["menu-item"]}
                    onClick={() => {
                      navigate("/notifications");
                      setShowDropdown(false);
                    }}
                  >
                    <span className={styles["menu-icon"]}>🔔</span>
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className={styles["menu-badge"]}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    className={styles["menu-item"]}
                    onClick={() => {
                      navigate("/aide");
                      setShowDropdown(false);
                    }}
                  >
                    <span className={styles["menu-icon"]}>❓</span>
                    <span>Aide & Support</span>
                  </button>
                </div>

                <div className={styles["panel-divider"]}></div>

                <div className={styles["panel-menu"]}>
                  <button
                    className={styles["menu-item"] + " " + styles["danger"]}
                    onClick={handleLogout}
                  >
                    <span className={styles["menu-icon"]}>🚪</span>
                    <span>Se Déconnecter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className={styles["search-overlay"]}>
          <div className={styles["search-overlay-content"]}>
            <span className={styles["search-overlay-icon"]}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
              autoFocus
              disabled={isSearching}
            />
            <button onClick={() => setShowSearch(false)} title="Fermer (Esc)">
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
