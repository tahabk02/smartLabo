import styles from "./App.module.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PatientProfile from "./features/patients/PatientProfile";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

// Pages
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AIPage from "./pages/AIPage";

// Auth
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import ProfilePage from "./features/profile/ProfilePage";
import { loadUser } from "./features/auth/authSlice";

// Features
import DashboardPage from "./features/dashboard/DashboardPage";
import UsersPage from "./features/users/UsersPage";
import PatientsPage from "./features/patients/PatientsPage";
import DoctorsPage from "./features/doctors/DoctorsPage";
import DoctorProfile from "./features/doctors/DoctorProfile";
import TasksPage from "./features/tasks/TasksPage";
import FacturesPage from "./features/factures/FacturesPage";
import AnalysesPage from "./features/analyses/AnalysesPage";
import AnalyseTypesPage from "./features/analyseTypes/AnalyseTypesPage";
import AppointmentsPage from "./features/appointments/pages/AppointmentsPage";

// 🆕 ESPACE PATIENT
import PatientDashboard from "./features/patients/components/PatientDashboard";

function App() {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  // États pour le Sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Get auth state with safe defaults
  const { isAuthenticated, user } = useSelector(
    (state) =>
      state.auth || {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      }
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem("token");

        if (token) {
          console.log("🔍 Token trouvé, chargement de l'utilisateur...");
          await dispatch(loadUser()).unwrap();
          console.log("✅ Utilisateur chargé avec succès");
        } else {
          console.log("⚠️ Aucun token trouvé");
        }
      } catch (error) {
        console.error("❌ Échec du chargement de l'utilisateur:", error);
        localStorage.removeItem("token");
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [dispatch]);

  // Gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 968) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Bloquer le scroll quand sidebar mobile est ouvert
  useEffect(() => {
    if (isMobileSidebarOpen && window.innerWidth <= 968) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  // Handlers pour le Sidebar
  const handleToggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  // 🆕 Vérifier si l'utilisateur est un patient
  const isPatient = user?.role === "patient";

  // Show loader during initialization
  if (isInitializing) {
    return <Loader fullscreen message="Chargement de SmartLabo..." />;
  }

  return (
    <BrowserRouter>
      <div className={styles["app"]}>
        {/* Navbar - Only show when authenticated and NOT patient */}
        {isAuthenticated && !isPatient && (
          <Navbar onToggleSidebar={handleToggleMobileSidebar} />
        )}

        <div className={styles["app-container"]}>
          {/* Sidebar - Only show when authenticated and NOT patient */}
          {isAuthenticated && !isPatient && (
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              isMobileOpen={isMobileSidebarOpen}
              onToggleCollapse={handleToggleSidebarCollapse}
              onCloseMobile={handleCloseMobileSidebar}
            />
          )}

          {/* Overlay pour mobile */}
          {isAuthenticated &&
            !isPatient &&
            isMobileSidebarOpen &&
            window.innerWidth <= 968 && (
              <div
                className={styles["sidebar-overlay"]}
                onClick={handleCloseMobileSidebar}
                role="button"
                aria-label="Fermer le menu"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCloseMobileSidebar()
                }
              />
            )}

          <main
            className={`${styles["main-content"]} ${
              isAuthenticated && !isPatient ? styles["with-sidebar"] : ""
            } ${isSidebarCollapsed ? styles["sidebar-collapsed"] : ""}`}
          >
            <Routes>
              {/* ==================== PUBLIC ROUTES ==================== */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    isPatient ? (
                      <Navigate to="/patient-space" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  ) : (
                    <Home />
                  )
                }
              />

              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    isPatient ? (
                      <Navigate to="/patient-space" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  ) : (
                    <LoginPage />
                  )
                }
              />

              <Route
                path="/register"
                element={
                  isAuthenticated ? (
                    isPatient ? (
                      <Navigate to="/patient-space" replace />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  ) : (
                    <RegisterPage />
                  )
                }
              />

              {/* ==================== ESPACE PATIENT ==================== */}
              <Route
                path="/patient-space"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ==================== PROTECTED ROUTES (STAFF) ==================== */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "receptionist", "nurse"]}
                  >
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patients"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "receptionist"]}
                  >
                    <PatientsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/patients/:id/profile"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "receptionist"]}
                  >
                    <PatientProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctors"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DoctorsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctors/profile/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DoctorProfile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tasks"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "receptionist", "nurse"]}
                  >
                    <TasksPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/factures"
                element={
                  <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
                    <FacturesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analyses"
                element={
                  <ProtectedRoute allowedRoles={["admin", "doctor"]}>
                    <AnalysesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analyse-types"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AnalyseTypesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai-agent"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "receptionist", "nurse"]}
                  >
                    <AIPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/appointments"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "doctor", "nurse", "receptionist"]}
                  >
                    <AppointmentsPage />
                  </ProtectedRoute>
                }
              />

              {/* ==================== CATCH ALL ==================== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          style={{ zIndex: 9999 }}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
