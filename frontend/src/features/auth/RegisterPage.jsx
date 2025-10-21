import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { register, clearError } from "./authSlice";
import { toast } from "react-toastify";
import styles from "./Auth.module.css";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: "",
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    role: "patient", // ✅ Toujours patient par défaut
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [characterMood, setCharacterMood] = useState("welcome");
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
      setCharacterMood("sad");
    }
    if (isAuthenticated) {
      setCharacterMood("success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    }
  }, [error, isAuthenticated, navigate, dispatch]);

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      let strength = 0;
      if (formData.password.length >= 8) strength += 25;
      if (formData.password.length >= 12) strength += 25;
      if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password))
        strength += 25;
      if (/\d/.test(formData.password)) strength += 15;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) strength += 10;
      setPasswordStrength(Math.min(strength, 100));

      if (strength < 40) setCharacterMood("worried");
      else if (strength < 70) setCharacterMood("thinking");
      else setCharacterMood("happy");
    } else {
      setPasswordStrength(0);
    }
  }, [formData.password]);

  // Track form progress
  useEffect(() => {
    const fields = [
      formData.prenom,
      formData.nom,
      formData.email,
      formData.password,
      formData.confirmPassword,
    ];
    const filledFields = fields.filter((f) => f.length > 0).length;
    setProgressStep(filledFields);

    if (filledFields === 5 && acceptTerms) {
      setCharacterMood("excited");
    } else if (filledFields === 0) {
      setCharacterMood("welcome");
    }
  }, [formData, acceptTerms]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.prenom.trim().length < 2) {
      newErrors.prenom = "Le prénom doit contenir au moins 2 caractères";
    }

    if (formData.nom.trim().length < 2) {
      newErrors.nom = "Le nom doit contenir au moins 2 caractères";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Veuillez entrer une adresse email valide";
    }

    if (
      formData.telephone &&
      !/^\+?\d{10,15}$/.test(formData.telephone.replace(/\s/g, ""))
    ) {
      newErrors.telephone = "Veuillez entrer un numéro de téléphone valide";
    }

    if (formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    if (!acceptTerms) {
      toast.error("Veuillez accepter les conditions d'utilisation");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setCharacterMood("sad");
      return;
    }

    // Préparer les données pour l'envoi
    const { confirmPassword, ...registerData } = formData;

    // Ajouter le champ 'name' pour compatibilité
    registerData.name = `${registerData.prenom} ${registerData.nom}`;

    console.log("📤 Sending registration data:", registerData);
    dispatch(register(registerData));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return "#f56565";
    if (passwordStrength < 70) return "#ed8936";
    return "#48bb78";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return "Faible";
    if (passwordStrength < 70) return "Moyen";
    return "Fort";
  };

  const getCharacterExpression = () => {
    const expressions = {
      welcome: { emoji: "😊", color: "#6366f1" },
      thinking: { emoji: "🤔", color: "#f59e0b" },
      worried: { emoji: "😟", color: "#ef4444" },
      happy: { emoji: "😄", color: "#10b981" },
      excited: { emoji: "🤩", color: "#8b5cf6" },
      sad: { emoji: "😢", color: "#6b7280" },
      success: { emoji: "🎉", color: "#10b981" },
    };
    return expressions[characterMood];
  };

  const getCharacterMessage = () => {
    const messages = {
      welcome: "Bienvenue! Créons votre compte 👋",
      thinking: "Continuez comme ça! 💪",
      worried: "Mot de passe faible... 🔒",
      happy: "Excellent mot de passe! ✨",
      excited: "Vous y êtes presque! 🚀",
      sad: "Oups! Vérifiez vos informations 😅",
      success: "Parfait! Bienvenue à bord! 🎊",
    };
    return messages[characterMood];
  };

  return (
    <div className={styles["auth-page"]}>
      {/* Character Section */}
      <div className={styles["character-section"]}>
        <div className={styles["character-container"]}>
          <div className={styles["character"]}>
            <div className={styles["character-head"]}>
              <div className={styles["character-face"]}>
                <div className={styles["character-eyes"]}>
                  {getCharacterExpression().emoji}
                </div>
              </div>
            </div>
            <div
              className={styles["character-body"]}
              style={{
                background: `linear-gradient(135deg, ${
                  getCharacterExpression().color
                }, ${getCharacterExpression().color}dd)`,
              }}
            >
              <div
                className={`${styles["character-arm"]} ${styles["left"]}`}
              ></div>
              <div
                className={`${styles["character-arm"]} ${styles["right"]}`}
              ></div>
            </div>
          </div>

          <div className={styles["progress-dots"]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${styles["dot"]} ${
                  i <= progressStep ? styles["active"] : ""
                }`}
                style={
                  i <= progressStep
                    ? { background: getCharacterExpression().color }
                    : {}
                }
              ></div>
            ))}
          </div>

          <p
            className={styles["character-message"]}
            style={{ color: getCharacterExpression().color }}
          >
            {getCharacterMessage()}
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className={styles["auth-card"]}>
        <div className={styles["auth-logo"]}>
          <img src="/logo.png" alt="SmartLab" />
          <h2>SmartLab</h2>
        </div>

        <h3>Créer un compte</h3>
        <p className={styles["auth-subtitle"]}>
          Rejoignez SmartLab dès aujourd'hui
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles["form-row"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="prenom">Prénom</label>
              <div className={styles["input-wrapper"]}>
                <input
                  id="prenom"
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Jean"
                  className={`${styles["form-control"]} ${
                    errors.prenom ? styles["error"] : ""
                  }`}
                  autoComplete="given-name"
                />
                <span className={styles["input-icon"]}>👤</span>
              </div>
              {errors.prenom && (
                <span className={styles["error-message"]}>
                  ⚠️ {errors.prenom}
                </span>
              )}
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="nom">Nom</label>
              <div className={styles["input-wrapper"]}>
                <input
                  id="nom"
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Dupont"
                  className={`${styles["form-control"]} ${
                    errors.nom ? styles["error"] : ""
                  }`}
                  autoComplete="family-name"
                />
                <span className={styles["input-icon"]}>👤</span>
              </div>
              {errors.nom && (
                <span className={styles["error-message"]}>⚠️ {errors.nom}</span>
              )}
            </div>
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="email">Adresse email</label>
            <div className={styles["input-wrapper"]}>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="votre.email@exemple.com"
                className={`${styles["form-control"]} ${
                  errors.email ? styles["error"] : ""
                }`}
                autoComplete="email"
              />
              <span className={styles["input-icon"]}>✉️</span>
            </div>
            {errors.email && (
              <span className={styles["error-message"]}>⚠️ {errors.email}</span>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="telephone">Téléphone (Optionnel)</label>
            <div className={styles["input-wrapper"]}>
              <input
                id="telephone"
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="+212 6XX XXX XXX"
                className={`${styles["form-control"]} ${
                  errors.telephone ? styles["error"] : ""
                }`}
                autoComplete="tel"
              />
              <span className={styles["input-icon"]}>📱</span>
            </div>
            {errors.telephone && (
              <span className={styles["error-message"]}>
                ⚠️ {errors.telephone}
              </span>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="password">Mot de passe</label>
            <div
              className={`${styles["input-wrapper"]} ${styles["password-wrapper"]}`}
            >
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Créez un mot de passe fort"
                className={`${styles["form-control"]} ${
                  errors.password ? styles["error"] : ""
                }`}
                minLength={6}
                autoComplete="new-password"
              />
              <span className={styles["input-icon"]}>🔒</span>
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {formData.password && (
              <div className={styles["password-strength"]}>
                <div className={styles["password-strength-bar"]}>
                  <div
                    className={styles["password-strength-fill"]}
                    style={{
                      width: `${passwordStrength}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  />
                </div>
                <span
                  className={styles["password-strength-text"]}
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
            {errors.password && (
              <span className={styles["error-message"]}>
                ⚠️ {errors.password}
              </span>
            )}
          </div>

          <div className={styles["form-group"]}>
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div
              className={`${styles["input-wrapper"]} ${styles["password-wrapper"]}`}
            >
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirmez votre mot de passe"
                className={`${styles["form-control"]} ${
                  errors.confirmPassword ? styles["error"] : ""
                }`}
                minLength={6}
                autoComplete="new-password"
              />
              <span className={styles["input-icon"]}>🔐</span>
              <button
                type="button"
                className={styles["password-toggle"]}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className={styles["error-message"]}>
                ⚠️ {errors.confirmPassword}
              </span>
            )}
          </div>

          <div
            className={`${styles["checkbox-wrapper"]} ${styles["terms-checkbox"]}`}
          >
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="terms">
              J'accepte les{" "}
              <Link to="/terms" className={styles["terms-link"]}>
                Conditions d'utilisation
              </Link>{" "}
              et la{" "}
              <Link to="/privacy" className={styles["terms-link"]}>
                Politique de confidentialité
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className={`${styles["btn-primary"]} ${styles["btn-block"]} ${
              loading ? styles["loading"] : ""
            }`}
            disabled={loading}
          >
            {loading ? "Création du compte..." : "S'inscrire"}
          </button>
        </form>

        <div className={styles["divider"]}>
          <span>Ou continuer avec</span>
        </div>

        <div className={styles["social-login"]}>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="S'inscrire avec Google"
          >
            <img src="https://www.google.com/favicon.ico" alt="" />
            <span>Google</span>
          </button>
          <button
            type="button"
            className={styles["btn-social"]}
            aria-label="S'inscrire avec GitHub"
          >
            <img src="https://github.com/favicon.ico" alt="" />
            <span>GitHub</span>
          </button>
        </div>

        <div className={styles["auth-links"]}>
          <p>
            Vous avez déjà un compte? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
