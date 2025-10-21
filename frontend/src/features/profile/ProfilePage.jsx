import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../features/auth/authSlice";
import { toast } from "react-toastify";
import styles from "./ProfilePage.module.css";

// Hook personnalisé pour gérer localStorage de manière sécurisée
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  // États principaux
  const [activeTab, setActiveTab] = useState("profile");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Données du formulaire
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
    ville: user?.ville || "",
    codePostal: user?.codePostal || "",
    dateNaissance: user?.dateNaissance || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Préférences
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailMarketing: false,
    language: "fr",
    securityAlerts: true,
  });

  // Synchroniser le mode sombre avec le DOM
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Synchroniser avec les données utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        ville: user.ville || "",
        codePostal: user.codePostal || "",
        dateNaissance: user.dateNaissance || "",
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  // Handlers mémorisés
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePasswordChange = useCallback((e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePreferenceChange = useCallback((key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    // Sauvegarder les préférences
    localStorage.setItem(`preference_${key}`, JSON.stringify(value));
    toast.success(`✅ Préférence "${key}" mise à jour`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updateData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          updateData.append(key, formData[key]);
        }
      });

      if (avatarFile) {
        updateData.append("avatar", avatarFile);
      }

      await dispatch(updateUser(updateData)).unwrap();
      toast.success("✅ Profil mis à jour avec succès !");
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      toast.error(
        error?.message || "❌ Erreur lors de la mise à jour du profil"
      );
      console.error("Erreur:", error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("❌ Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("❌ Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors du changement de mot de passe"
        );
      }

      toast.success("✅ Mot de passe modifié avec succès !");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("❌ " + error.message);
    }
  };

  const handleAvatarChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5000000) {
      toast.error("❌ L'image ne doit pas dépasser 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("❌ Le fichier doit être une image");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
      setAvatarFile(file);
      toast.success(
        "✅ Photo sélectionnée. Cliquez sur 'Enregistrer' pour sauvegarder."
      );
    };
    reader.onerror = () => {
      toast.error("❌ Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
  }, []);

  const removeAvatar = useCallback(() => {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("📷 Photo supprimée. Cliquez sur 'Enregistrer' pour confirmer.");
  }, []);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(user?.avatar || null);
    setFormData({
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      email: user?.email || "",
      telephone: user?.telephone || "",
      adresse: user?.adresse || "",
      ville: user?.ville || "",
      codePostal: user?.codePostal || "",
      dateNaissance: user?.dateNaissance || "",
    });
  }, [user]);

  // Utilitaires mémorisés
  const getUserInitials = useMemo(() => {
    if (!user?.nom) return "?";
    return `${user.nom.charAt(0)}${user.prenom?.charAt(0) || ""}`.toUpperCase();
  }, [user?.nom, user?.prenom]);

  const getRoleBadgeColor = useCallback((role) => {
    const colors = {
      admin: "#ef4444",
      doctor: "#3b82f6",
      receptionist: "#10b981",
      lab_tech: "#f59e0b",
    };
    return colors[role] || "#6b7280";
  }, []);

  const getRoleLabel = useCallback((role) => {
    const labels = {
      admin: "Administrateur",
      doctor: "Médecin",
      receptionist: "Réceptionniste",
      lab_tech: "Technicien Lab",
    };
    return labels[role] || role;
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Compte créé",
        value: new Date(user?.createdAt || Date.now()).toLocaleDateString(
          "fr-FR"
        ),
        icon: "📅",
      },
      { label: "Dernière connexion", value: "Aujourd'hui", icon: "🕐" },
      { label: "Rôle", value: getRoleLabel(user?.role), icon: "👤" },
      { label: "Statut", value: "Actif", icon: "✅" },
    ],
    [user?.createdAt, user?.role, getRoleLabel]
  );

  const avatarStyle = useMemo(
    () => ({
      background: avatarPreview
        ? `url(${avatarPreview})`
        : `linear-gradient(135deg, ${getRoleBadgeColor(
            user?.role
          )}, ${getRoleBadgeColor(user?.role)}dd)`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }),
    [avatarPreview, user?.role, getRoleBadgeColor]
  );

  return (
    <div
      className={`${styles["profile-page"]} ${
        isDarkMode ? styles["dark-mode"] : ""
      }`}
    >
      {/* Header */}
      <div className={styles["profile-header"]}>
        <div className={styles["header-content"]}>
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles et vos préférences</p>
        </div>
      </div>

      <div className={styles["profile-container"]}>
        {/* Sidebar */}
        <div className={styles["profile-sidebar"]}>
          {/* Profile Card */}
          <div className={styles["profile-card"]}>
            <div className={styles["avatar-section"]}>
              <div className={styles["avatar-large"]} style={avatarStyle}>
                {!avatarPreview && <span>{getUserInitials}</span>}
              </div>
              <button
                className={styles["avatar-edit-btn"]}
                onClick={() => fileInputRef.current?.click()}
                title="Changer la photo"
                aria-label="Changer la photo de profil"
              >
                <span>📷</span>
              </button>
              {avatarPreview && (
                <button
                  className={styles["avatar-remove-btn"]}
                  onClick={removeAvatar}
                  title="Supprimer la photo"
                  aria-label="Supprimer la photo de profil"
                >
                  <span>🗑️</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>

            <div className={styles["profile-info"]}>
              <h2>
                {user?.nom} {user?.prenom}
              </h2>
              <p className={styles["profile-email"]}>{user?.email}</p>
              <span
                className={styles["role-badge"]}
                style={{ background: getRoleBadgeColor(user?.role) }}
              >
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <div className={styles["profile-stats"]}>
              {stats.map((stat, index) => (
                <div key={index} className={styles["stat-item"]}>
                  <span className={styles["stat-icon"]}>{stat.icon}</span>
                  <div className={styles["stat-content"]}>
                    <span className={styles["stat-label"]}>{stat.label}</span>
                    <span className={styles["stat-value"]}>{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={styles["profile-nav"]}>
            <button
              className={`${styles["nav-item"]} ${
                activeTab === "profile" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("profile")}
              aria-current={activeTab === "profile" ? "page" : undefined}
            >
              <span className={styles["nav-icon"]}>👤</span>
              <span>Informations</span>
            </button>
            <button
              className={`${styles["nav-item"]} ${
                activeTab === "security" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("security")}
              aria-current={activeTab === "security" ? "page" : undefined}
            >
              <span className={styles["nav-icon"]}>🔒</span>
              <span>Sécurité</span>
            </button>
            <button
              className={`${styles["nav-item"]} ${
                activeTab === "preferences" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("preferences")}
              aria-current={activeTab === "preferences" ? "page" : undefined}
            >
              <span className={styles["nav-icon"]}>⚙️</span>
              <span>Préférences</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles["profile-content"]}>
          {activeTab === "profile" && (
            <ProfileTabContent
              formData={formData}
              isEditing={isEditing}
              loading={loading}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              setIsEditing={setIsEditing}
              cancelEditing={cancelEditing}
              styles={styles}
            />
          )}

          {activeTab === "security" && (
            <SecurityTabContent
              passwordData={passwordData}
              preferences={preferences}
              handlePasswordChange={handlePasswordChange}
              handlePasswordSubmit={handlePasswordSubmit}
              handlePreferenceChange={handlePreferenceChange}
              styles={styles}
            />
          )}

          {activeTab === "preferences" && (
            <PreferencesTabContent
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              preferences={preferences}
              handlePreferenceChange={handlePreferenceChange}
              styles={styles}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour l'onglet Profil
const ProfileTabContent = ({
  formData,
  isEditing,
  loading,
  handleChange,
  handleSubmit,
  setIsEditing,
  cancelEditing,
  styles,
}) => (
  <div className={styles["content-section"]}>
    <div className={styles["section-header"]}>
      <div>
        <h2>Informations Personnelles</h2>
        <p>Mettez à jour vos informations de profil</p>
      </div>
      {!isEditing ? (
        <button
          className={styles["btn-primary"]}
          onClick={() => setIsEditing(true)}
        >
          <span>✏️</span> Modifier
        </button>
      ) : (
        <button className={styles["btn-secondary"]} onClick={cancelEditing}>
          Annuler
        </button>
      )}
    </div>

    <form onSubmit={handleSubmit} className={styles["profile-form"]}>
      <div className={styles["form-grid"]}>
        <FormField
          label="Nom"
          icon="👤"
          id="nom"
          name="nom"
          type="text"
          value={formData.nom}
          onChange={handleChange}
          disabled={!isEditing}
          required
          styles={styles}
        />

        <FormField
          label="Prénom"
          icon="👤"
          id="prenom"
          name="prenom"
          type="text"
          value={formData.prenom}
          onChange={handleChange}
          disabled={!isEditing}
          required
          styles={styles}
        />

        <FormField
          label="Email"
          icon="📧"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={!isEditing}
          required
          styles={styles}
        />

        <FormField
          label="Téléphone"
          icon="📞"
          id="telephone"
          name="telephone"
          type="tel"
          value={formData.telephone}
          onChange={handleChange}
          disabled={!isEditing}
          styles={styles}
        />

        <FormField
          label="Date de naissance"
          icon="📅"
          id="dateNaissance"
          name="dateNaissance"
          type="date"
          value={formData.dateNaissance}
          onChange={handleChange}
          disabled={!isEditing}
          styles={styles}
        />

        <FormField
          label="Adresse"
          icon="🏠"
          id="adresse"
          name="adresse"
          type="text"
          value={formData.adresse}
          onChange={handleChange}
          disabled={!isEditing}
          fullWidth
          styles={styles}
        />

        <FormField
          label="Ville"
          icon="🏙️"
          id="ville"
          name="ville"
          type="text"
          value={formData.ville}
          onChange={handleChange}
          disabled={!isEditing}
          styles={styles}
        />

        <FormField
          label="Code Postal"
          icon="📮"
          id="codePostal"
          name="codePostal"
          type="text"
          value={formData.codePostal}
          onChange={handleChange}
          disabled={!isEditing}
          styles={styles}
        />
      </div>

      {isEditing && (
        <div className={styles["form-actions"]}>
          <button
            type="submit"
            className={styles["btn-save"]}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles["spinner"]}></span>
                Enregistrement...
              </>
            ) : (
              "💾 Enregistrer les modifications"
            )}
          </button>
        </div>
      )}
    </form>
  </div>
);

// Composant pour l'onglet Sécurité
const SecurityTabContent = ({
  passwordData,
  preferences,
  handlePasswordChange,
  handlePasswordSubmit,
  handlePreferenceChange,
  styles,
}) => (
  <div className={styles["content-section"]}>
    <div className={styles["section-header"]}>
      <div>
        <h2>Sécurité</h2>
        <p>Gérez votre mot de passe et la sécurité de votre compte</p>
      </div>
    </div>

    <form onSubmit={handlePasswordSubmit} className={styles["profile-form"]}>
      <div className={styles["form-grid"]}>
        <FormField
          label="Mot de passe actuel"
          icon="🔒"
          id="currentPassword"
          name="currentPassword"
          type="password"
          value={passwordData.currentPassword}
          onChange={handlePasswordChange}
          placeholder="Entrez votre mot de passe actuel"
          required
          fullWidth
          autoComplete="current-password"
          styles={styles}
        />

        <FormField
          label="Nouveau mot de passe"
          icon="🔑"
          id="newPassword"
          name="newPassword"
          type="password"
          value={passwordData.newPassword}
          onChange={handlePasswordChange}
          placeholder="Minimum 6 caractères"
          required
          autoComplete="new-password"
          styles={styles}
        />

        <FormField
          label="Confirmer le mot de passe"
          icon="✅"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={passwordData.confirmPassword}
          onChange={handlePasswordChange}
          placeholder="Confirmez le nouveau mot de passe"
          required
          autoComplete="new-password"
          styles={styles}
        />
      </div>

      <div className={styles["form-actions"]}>
        <button type="submit" className={styles["btn-save"]}>
          🔐 Changer le mot de passe
        </button>
      </div>
    </form>

    <div className={styles["security-options"]}>
      <SecurityOption
        icon="📱"
        title="Authentification à deux facteurs"
        description="Ajoutez une couche de sécurité supplémentaire"
        action={<button className={styles["btn-secondary"]}>Activer</button>}
        styles={styles}
      />

      <SecurityOption
        icon="📧"
        title="Notifications de sécurité"
        description="Recevez des alertes pour toute activité suspecte"
        action={
          <label className={styles["toggle-switch"]}>
            <input
              type="checkbox"
              checked={preferences.securityAlerts}
              onChange={(e) =>
                handlePreferenceChange("securityAlerts", e.target.checked)
              }
            />
            <span className={styles["toggle-slider"]}></span>
          </label>
        }
        styles={styles}
      />
    </div>
  </div>
);

// Composant pour l'onglet Préférences
const PreferencesTabContent = ({
  isDarkMode,
  setIsDarkMode,
  preferences,
  handlePreferenceChange,
  styles,
}) => (
  <div className={styles["content-section"]}>
    <div className={styles["section-header"]}>
      <div>
        <h2>Préférences</h2>
        <p>Personnalisez votre expérience</p>
      </div>
    </div>

    <div className={styles["preferences-grid"]}>
      <PreferenceItem
        icon="🌙"
        title="Mode sombre"
        description="Activez le thème sombre"
        control={
          <label className={styles["toggle-switch"]}>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
            />
            <span className={styles["toggle-slider"]}></span>
          </label>
        }
        styles={styles}
      />

      <PreferenceItem
        icon="🔔"
        title="Notifications"
        description="Recevez des notifications"
        control={
          <label className={styles["toggle-switch"]}>
            <input
              type="checkbox"
              checked={preferences.notifications}
              onChange={(e) =>
                handlePreferenceChange("notifications", e.target.checked)
              }
            />
            <span className={styles["toggle-slider"]}></span>
          </label>
        }
        styles={styles}
      />

      <PreferenceItem
        icon="🌍"
        title="Langue"
        description="Choisissez votre langue"
        control={
          <select
            className={styles["preference-select"]}
            value={preferences.language}
            onChange={(e) => handlePreferenceChange("language", e.target.value)}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        }
        styles={styles}
      />

      <PreferenceItem
        icon="📧"
        title="Emails marketing"
        description="Recevez nos actualités"
        control={
          <label className={styles["toggle-switch"]}>
            <input
              type="checkbox"
              checked={preferences.emailMarketing}
              onChange={(e) =>
                handlePreferenceChange("emailMarketing", e.target.checked)
              }
            />
            <span className={styles["toggle-slider"]}></span>
          </label>
        }
        styles={styles}
      />
    </div>
  </div>
);

// Composant réutilisable pour les champs de formulaire
const FormField = ({
  label,
  icon,
  id,
  name,
  type,
  value,
  onChange,
  disabled,
  required,
  placeholder,
  autoComplete,
  fullWidth,
  styles,
}) => (
  <div
    className={`${styles["form-group"]} ${
      fullWidth ? styles["full-width"] : ""
    }`}
  >
    <label className={styles["form-label"]} htmlFor={id}>
      <span className={styles["label-icon"]}>{icon}</span>
      {label}
    </label>
    <input
      id={id}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={styles["form-input"]}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      autoComplete={autoComplete}
    />
  </div>
);

// Composant pour les options de sécurité
const SecurityOption = ({ icon, title, description, action, styles }) => (
  <div className={styles["security-item"]}>
    <div className={styles["security-info"]}>
      <span className={styles["security-icon"]}>{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
    {action}
  </div>
);

// Composant pour les éléments de préférence
const PreferenceItem = ({ icon, title, description, control, styles }) => (
  <div className={styles["preference-item"]}>
    <div className={styles["preference-info"]}>
      <span className={styles["preference-icon"]}>{icon}</span>
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </div>
    {control}
  </div>
);

export default ProfilePage;
