import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "2rem" }}>Chargement...</p>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <p style={{ textAlign: "center", marginTop: "2rem", color: "red" }}>
        ❌ Accès refusé : vous n'avez pas la permission
      </p>
    );
  }

  return children;
};

export default ProtectedRoute;
