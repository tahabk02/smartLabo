// frontend/src/features/patient/components/PatientDashboard.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../auth/authSlice";
import styles from "./PatientDashboard.module.css";
import {
  Calendar,
  Activity,
  Receipt,
  User,
  CreditCard,
  Heart,
  Menu,
  X,
  Bell,
  LogOut,
  TrendingUp,
  Settings,
  HelpCircle,
} from "lucide-react";

// Import de tous les composants
import DashboardView from "./DashboardView";
import AppointmentsView from "./AppointmentsView";
import ProfileView from "./ProfileView";
import AnalysesView from "./AnalysesView";
// ✅ CORRECTION: Import depuis le bon dossier
import InvoicesView from "../../patients/components/InvoicesView";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const notificationRef = useRef(null);

  // Configuration du menu
  const menuItems = [
    {
      id: "dashboard",
      name: "Tableau de bord",
      icon: TrendingUp,
      component: DashboardView,
    },
    {
      id: "appointments",
      name: "Rendez-vous",
      icon: Calendar,
      component: AppointmentsView,
    },
    {
      id: "analyses",
      name: "Analyses",
      icon: Activity,
      component: AnalysesView,
    },
    {
      id: "invoices",
      name: "Factures",
      icon: Receipt,
      component: InvoicesView,
    },
    {
      id: "profile",
      name: "Mon Profil",
      icon: User,
      component: ProfileView,
    },
    {
      id: "nfc",
      name: "Carte NFC",
      icon: CreditCard,
      component: () => <ComingSoon name="Carte NFC" icon={CreditCard} />,
    },
  ];

  // Notifications simulées
  const notifications = [
    {
      id: 1,
      title: "Résultats disponibles",
      message: "Vos résultats d'analyse sont prêts",
      time: "Il y a 2 heures",
      type: "success",
      unread: true,
    },
    {
      id: 2,
      title: "Rappel rendez-vous",
      message: "RDV demain à 14h00",
      time: "Il y a 5 heures",
      type: "info",
      unread: true,
    },
    {
      id: 3,
      title: "Facture disponible",
      message: "Votre facture du 15/01/2025 est disponible",
      time: "Il y a 1 jour",
      type: "warning",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Handlers
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);

  const handleSectionChange = useCallback((sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const toggleNotifications = useCallback(() => {
    setNotificationsOpen((prev) => !prev);
  }, []);

  // Fermer les notifications en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // Bloquer le scroll du body quand sidebar mobile est ouverte
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Détecter le scroll pour effet header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const ActiveComponent =
    menuItems.find((item) => item.id === activeSection)?.component ||
    DashboardView;

  return (
    <div className={styles.dashboardWrapper}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={toggleSidebar}
          role="button"
          tabIndex={0}
          aria-label="Fermer le menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        {/* Logo Section */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <Heart />
            </div>
            <div className={styles.logoText}>
              <h2 className={styles.logoTitle}>SmartLabo</h2>
              <p className={styles.logoSubtitle}>Espace Patient</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className={styles.closeSidebarButton}
            aria-label="Fermer le menu"
          >
            <X />
          </button>
        </div>

        {/* User Info Card */}
        <div className={styles.userInfo}>
          <div className={styles.userInfoContent}>
            <div className={styles.userAvatar}>
              <span>{user?.name?.charAt(0)?.toUpperCase() || "P"}</span>
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{user?.name || "Patient"}</p>
              <p className={styles.userEmail}>{user?.email}</p>
              {user?.patientInfo?.numeroPatient && (
                <p className={styles.userPatientNumber}>
                  {user.patientInfo.numeroPatient}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navigation}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`${styles.navItem} ${
                  active ? styles.navItemActive : ""
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={styles.navIcon} />
                <span className={styles.navLabel}>{item.name}</span>
                {active && <div className={styles.activeIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <button className={styles.quickActionBtn}>
            <Settings className={styles.quickActionIcon} />
            <span>Paramètres</span>
          </button>
          <button className={styles.quickActionBtn}>
            <HelpCircle className={styles.quickActionIcon} />
            <span>Aide</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogOut />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Top Bar */}
        <header
          className={`${styles.topBar} ${
            isScrolled ? styles.topBarScrolled : ""
          }`}
        >
          <div className={styles.topBarContent}>
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className={styles.mobileMenuButton}
              aria-label="Ouvrir le menu"
            >
              <Menu />
            </button>

            {/* Page Title */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                {menuItems.find((item) => item.id === activeSection)?.name ||
                  "Tableau de bord"}
              </h1>
              <p className={styles.pageSubtitle}>
                Bienvenue dans votre espace patient
              </p>
            </div>

            {/* Right Actions */}
            <div className={styles.topBarActions}>
              {/* Notifications */}
              <div
                className={styles.notificationsContainer}
                ref={notificationRef}
              >
                <button
                  onClick={toggleNotifications}
                  className={`${styles.notificationButton} ${
                    notificationsOpen ? styles.notificationButtonActive : ""
                  }`}
                  aria-label="Notifications"
                >
                  <Bell />
                  {unreadCount > 0 && (
                    <span className={styles.notificationBadge}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <div className={styles.notificationsDropdown}>
                    <div className={styles.notificationsHeader}>
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className={styles.unreadCount}>
                          {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className={styles.notificationsList}>
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`${styles.notificationItem} ${
                            notification.unread ? styles.notificationUnread : ""
                          }`}
                        >
                          <div
                            className={`${styles.notificationDot} ${
                              styles[
                                `notificationDot${
                                  notification.type.charAt(0).toUpperCase() +
                                  notification.type.slice(1)
                                }`
                              ]
                            }`}
                          />
                          <div className={styles.notificationContent}>
                            <p className={styles.notificationTitle}>
                              {notification.title}
                            </p>
                            <p className={styles.notificationText}>
                              {notification.message}
                            </p>
                            <p className={styles.notificationTime}>
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.notificationsFooter}>
                      <button className={styles.viewAllNotifications}>
                        Voir toutes les notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar - Mobile */}
              <div className={styles.mobileUserAvatar}>
                <span>{user?.name?.charAt(0)?.toUpperCase() || "P"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={styles.contentArea}>
          <div className={styles.contentContainer}>
            <ActiveComponent />
          </div>
        </main>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p className={styles.footerCopyright}>
              © 2025 SmartLabo. Tous droits réservés.
            </p>
            <div className={styles.footerLinks}>
              <button className={styles.footerLink}>Aide</button>
              <button className={styles.footerLink}>Confidentialité</button>
              <button className={styles.footerLink}>Conditions</button>
              <button className={styles.footerLink}>Contact</button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Composant "Coming Soon" amélioré
const ComingSoon = ({ name, icon: Icon }) => (
  <div className={styles.comingSoon}>
    <div className={styles.comingSoonIcon}>{Icon && <Icon />}</div>
    <h2 className={styles.comingSoonTitle}>{name}</h2>
    <p className={styles.comingSoonText}>
      Cette section est en cours de développement
    </p>
    <p className={styles.comingSoonDescription}>
      Nous travaillons activement pour vous offrir cette fonctionnalité
      prochainement.
    </p>
    <div className={styles.comingSoonBadge}>
      <span>Bientôt disponible 🚀</span>
    </div>
  </div>
);

export default PatientDashboard;
