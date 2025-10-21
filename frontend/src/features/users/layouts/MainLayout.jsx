import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import styles from "./MainLayout.module.css";

const MainLayout = () => {
  // État du sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 968);

  // Détecter le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 968;
      setIsMobile(mobile);

      // Fermer le sidebar mobile lors du passage en desktop
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Gérer le collapse du sidebar
  const handleToggleCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  // Gérer l'ouverture/fermeture mobile
  const handleToggleMobile = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleCloseMobile = () => {
    setIsMobileSidebarOpen(false);
  };

  // Bloquer le scroll quand le sidebar mobile est ouvert
  useEffect(() => {
    if (isMobileSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen, isMobile]);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onToggleCollapse={handleToggleCollapse}
        onCloseMobile={handleCloseMobile}
      />

      {/* Overlay pour mobile */}
      {isMobileSidebarOpen && isMobile && (
        <div
          className={styles.overlay}
          onClick={handleCloseMobile}
          role="button"
          aria-label="Fermer le menu"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleCloseMobile()}
        />
      )}

      {/* Contenu principal */}
      <div
        className={`${styles.mainContent} ${
          isSidebarCollapsed ? styles.collapsed : ""
        }`}
      >
        {/* Navbar */}
        <Navbar onToggleSidebar={handleToggleMobile} />

        {/* Zone de contenu */}
        <main className={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
