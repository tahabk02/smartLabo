import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiCheckSquare,
  FiFileText,
  FiUser,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from "react-icons/fi";
import { MdScience } from "react-icons/md";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const Sidebar = ({
  isCollapsed,
  isMobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) => {
  const { user } = useSelector((state) => state.auth);

  // 🆕 Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        onCloseMobile();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen, onCloseMobile]);

  const menuItems = [
    {
      path: "/dashboard",
      icon: <FiHome />,
      label: "Dashboard",
      roles: ["admin", "doctor", "receptionist", "lab_tech"],
      description: "Vue d'ensemble",
    },
    {
      path: "/users",
      icon: <FiUser />,
      label: "Utilisateurs",
      roles: ["admin"],
      description: "Gestion users",
    },
    {
      path: "/patients",
      icon: <FiUsers />,
      label: "Patients",
      roles: ["admin", "doctor", "receptionist"],
      description: "Dossiers patients",
    },
    {
      path: "/doctors",
      icon: <FiUserCheck />,
      label: "Médecins",
      roles: ["admin"],
      description: "Gestion médecins",
    },
    {
      path: "/analyses",
      icon: <FiActivity />,
      label: "Analyses",
      roles: ["admin", "doctor", "lab_tech"],
      description: "Tests médicaux",
    },
    {
      path: "/analyse-types",
      icon: <MdScience />,
      label: "Types d'Analyses",
      roles: ["admin"],
      description: "Config tests",
    },
    {
      path: "/tasks",
      icon: <FiCheckSquare />,
      label: "Tâches",
      roles: ["admin", "doctor", "receptionist", "lab_tech"],
      description: "Gestion tâches",
    },
    {
      path: "/factures",
      icon: <FiFileText />,
      label: "Factures",
      roles: ["admin", "receptionist"],
      description: "Facturation",
    },
    // 🆕 Rendez-vous ajouté ici
    {
      path: "/appointments",
      icon: <FiCalendar />,
      label: "Rendez-vous",
      roles: ["admin", "doctor", "receptionist"],
      description: "Gestion des rendez-vous",
    },
  ];

  // Grouper les items
  const categorizedMenu = [
    {
      category: "Principal",
      items: menuItems.filter((item) =>
        ["dashboard", "users"].some((path) => item.path.includes(path))
      ),
    },
    {
      category: "Médical",
      items: menuItems.filter((item) =>
        [
          "patients",
          "doctors",
          "analyses",
          "analyse-types",
          "appointments", // 🆕 ajouté ici aussi
        ].some((path) => item.path.includes(path))
      ),
    },
    {
      category: "Opérations",
      items: menuItems.filter((item) =>
        ["tasks", "factures"].some((path) => item.path.includes(path))
      ),
    },
  ];

  const getUserInitials = () => {
    if (!user?.nom) return "U";
    return `${user.nom} ${user.prenom || ""}`
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: "#ef4444",
      doctor: "#3b82f6",
      receptionist: "#10b981",
      lab_tech: "#f59e0b",
    };
    return colors[role] || "#6b7280";
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${
        isMobileOpen ? styles.mobileOpen : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className={styles["sidebar-header"]}>
        <div className={styles["sidebar-brand"]}>
          <div className={styles["brand-icon"]}>🔬</div>
          {!isCollapsed && (
            <span className={styles["brand-name"]}>SmartLabo</span>
          )}
        </div>
        <button
          className={styles["sidebar-toggle"]}
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {/* User Profile Section */}
      <div className={styles["sidebar-profile"]}>
        <div
          className={styles["profile-avatar"]}
          style={{ background: getRoleBadgeColor(user?.role) }}
        >
          {getUserInitials()}
        </div>
        {!isCollapsed && (
          <div className={styles["profile-info"]}>
            <div className={styles["profile-name"]}>
              {user?.nom} {user?.prenom}
            </div>
            <div
              className={styles["profile-role"]}
              style={{ color: getRoleBadgeColor(user?.role) }}
            >
              {user?.role?.replace("_", " ").toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={styles["sidebar-nav"]}>
        {categorizedMenu.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.roles || item.roles.includes(user?.role)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.category} className={styles["nav-group"]}>
              {!isCollapsed && (
                <div className={styles["nav-group-label"]}>
                  {group.category}
                </div>
              )}
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles["sidebar-item"]} ${isActive ? styles.active : ""}`
                  }
                  title={isCollapsed ? item.label : ""}
                  onClick={() => isMobileOpen && onCloseMobile()} // 🆕 Fermer sur mobile
                >
                  <span className={styles["sidebar-icon"]}>{item.icon}</span>
                  {!isCollapsed && (
                    <div className={styles["sidebar-content"]}>
                      <span className={styles["sidebar-label"]}>
                        {item.label}
                      </span>
                      <span className={styles["sidebar-description"]}>
                        {item.description}
                      </span>
                    </div>
                  )}
                  <div className={styles["item-indicator"]}></div>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className={styles["sidebar-footer"]}>
          <div className={styles["footer-stats"]}>
            <div className={styles["stat-item"]}>
              <span className={styles["stat-icon"]}>📊</span>
              <span className={styles["stat-label"]}>Version 2.0</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
