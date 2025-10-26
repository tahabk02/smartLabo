import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { login, clearError } from "./authSlice";
import { toast } from "react-toastify";
import styles from "./Auth.module.css";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 CORRECTION : Meilleure gestion de la redirection
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // 🔥 CORRECTION : Redirection basée sur l'authentification ET le rôle
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("✅ User authenticated, redirecting...", user.role);

      // Petite pause pour permettre à l'UI de se mettre à jour
      setTimeout(() => {
        if (user.role === "patient") {
          navigate("/patient-space", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }, 100);
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    console.log("🔄 Attempting login...");

    try {
      const result = await dispatch(login(formData)).unwrap();

      if (result && result.user) {
        console.log("✅ Login successful, user:", result.user.email);
        // La redirection se fera automatiquement via le useEffect
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      // L'erreur est déjà gérée par le slice et affichée via toast
    }
  };

  // 🔥 CORRECTION : Empêcher l'affichage de la page de login si déjà authentifié
  if (isAuthenticated) {
    return (
      <div className={styles["auth-page"]}>
        <div className={styles["auth-card"]}>
          <div className={styles["loading-container"]}>
            <div className={styles["spinner"]}></div>
            <p>Redirection en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-card"]}>
        <div className={styles["auth-logo"]}>
          <img src="/logo.png" alt="SmartLab" />
          <h2>SmartLab</h2>
        </div>

        <h3>Bienvenue</h3>
        <p className={styles["auth-subtitle"]}>Connectez-vous à votre compte</p>

        <form onSubmit={handleSubmit}>
          <div className={styles["form-group"]}>
            <label htmlFor="email">Adresse email</label>
            <div className={styles["input-wrapper"]}>
              <span className={styles["input-icon"]}>✉️</span>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre.email@exemple.com"
                className={styles["form-control"]}
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="password">Mot de passe</label>
            <div
              className={`${styles["input-wrapper"]} ${styles["password-wrapper"]}`}
            >
              <span className={styles["input-icon"]}>🔒</span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Entrez votre mot de passe"
                className={styles["form-control"]}
                minLength={6}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className={styles["remember-forgot"]}>
            <div className={styles["checkbox-wrapper"]}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <label htmlFor="remember">Se souvenir de moi</label>
            </div>
            <Link to="/forgot-password" className={styles["forgot-link"]}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            className={`${styles["btn-block"]} ${styles["btn-primary"]} ${
              loading ? styles["loading"] : ""
            }`}
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className={styles["divider"]}>
          <span>Ou continuer avec</span>
        </div>

        <div className={styles["social-login"]}>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="Se connecter avec Google"
            disabled={loading}
          >
            <img src="https://www.google.com/favicon.ico" alt="" />
            <span>Google</span>
          </button>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="Se connecter avec GitHub"
            disabled={loading}
          >
            <img src="https://github.com/favicon.ico" alt="" />
            <span>GitHub</span>
          </button>
        </div>

        <div className={styles["auth-links"]}>
          <p>
            Vous n'avez pas de compte ? <Link to="/register">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
