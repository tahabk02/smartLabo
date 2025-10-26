// frontend/src/features/patient/components/ProfileView.jsx

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Droplet,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  IdCard,
} from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./ProfileView.module.css";

const ProfileView = () => {
  const { user: reduxUser } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    address: "",
    city: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrors({});

      console.log("👤 Loading profile...");
      const data = await patientApi.getProfile();
      console.log("✅ Profile loaded:", data);

      setProfile(data);
      setFormData({
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
      });
    } catch (error) {
      console.error("❌ Error loading profile:", error);
      setErrors({
        general: error.message || "Erreur lors du chargement du profil",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone || formData.phone.trim() === "") {
      newErrors.phone = "Le téléphone est requis";
    } else if (!/^[0-9+\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Format de téléphone invalide";
    }

    if (!formData.address || formData.address.trim() === "") {
      newErrors.address = "L'adresse est requise";
    }

    if (!formData.city || formData.city.trim() === "") {
      newErrors.city = "La ville est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrors({});

      console.log("📝 Submitting profile update...");
      const updatedData = await patientApi.updateProfile(formData);
      console.log("✅ Profile update response:", updatedData);

      setSuccessMessage("✅ Profil mis à jour avec succès !");
      setIsEditing(false);

      // Recharger le profil
      await loadProfile();

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("❌ Update error:", error);
      // Afficher un message d'erreur plus user-friendly
      if (
        error.message.includes("hors ligne") ||
        error.message.includes("localement")
      ) {
        setSuccessMessage("✅ Profil sauvegardé localement !");
        setIsEditing(false);
        await loadProfile();
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        setErrors({
          general: error.message || "Erreur lors de la mise à jour du profil",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <Loader2 className={styles.spinnerIcon} />
        </div>
        <p className={styles.loadingText}>Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Success Message */}
      {successMessage && (
        <div className={styles.successAlert}>
          <CheckCircle2 className={styles.alertIcon} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Mon Profil</h2>
          <p className={styles.pageSubtitle}>
            Gérez vos informations personnelles
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            <Edit2 />
            <span>Modifier</span>
          </button>
        )}
      </div>

      {/* Profile Header Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <User />
            </div>
          </div>
          <div className={styles.profileInfo}>
            <h3 className={styles.profileName}>
              {profile?.firstName} {profile?.lastName}
            </h3>
            <div className={styles.profileMeta}>
              <span className={styles.patientNumber}>
                <Shield className={styles.metaIcon} />
                {profile?.numeroPatient || "N/A"}
              </span>
              {profile?.cin && (
                <span className={styles.cin}>
                  <IdCard className={styles.metaIcon} />
                  CIN: {profile.cin}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className={styles.errorAlert}>
          <AlertCircle className={styles.alertIcon} />
          <span>{errors.general}</span>
        </div>
      )}

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <User className={styles.sectionIcon} />
              Informations de contact
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Téléphone <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className={`${styles.input} ${
                      errors.phone ? styles.inputError : ""
                    }`}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                {errors.phone && (
                  <p className={styles.errorText}>{errors.phone}</p>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label}>
                  Ville <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin className={styles.inputIcon} />
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className={`${styles.input} ${
                      errors.city ? styles.inputError : ""
                    }`}
                    placeholder="Ex: Casablanca"
                  />
                </div>
                {errors.city && (
                  <p className={styles.errorText}>{errors.city}</p>
                )}
              </div>

              <div className={styles.formFieldFull}>
                <label className={styles.label}>
                  Adresse complète <span className={styles.required}>*</span>
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin className={styles.inputIcon} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className={`${styles.input} ${
                      errors.address ? styles.inputError : ""
                    }`}
                    placeholder="Ex: 123 Rue Mohamed V, Quartier Maarif"
                  />
                </div>
                {errors.address && (
                  <p className={styles.errorText}>{errors.address}</p>
                )}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              <X />
              <span>Annuler</span>
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className={styles.spinning} />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Display Profile */
        <div className={styles.infoSection}>
          <h3 className={styles.sectionTitle}>
            <User className={styles.sectionIcon} />
            Informations personnelles
          </h3>
          <div className={styles.infoGrid}>
            <InfoItem
              icon={<User />}
              label="Nom complet"
              value={`${profile?.firstName || ""} ${profile?.lastName || ""}`}
            />
            <InfoItem
              icon={<Mail />}
              label="Email"
              value={profile?.email || "Non renseigné"}
            />
            <InfoItem
              icon={<Phone />}
              label="Téléphone"
              value={profile?.phone || "Non renseigné"}
            />
            <InfoItem
              icon={<Calendar />}
              label="Date de naissance"
              value={
                profile?.birthDate
                  ? new Date(profile.birthDate).toLocaleDateString("fr-FR")
                  : "Non renseignée"
              }
            />
            <InfoItem
              icon={<User />}
              label="Sexe"
              value={
                profile?.gender === "male"
                  ? "Homme"
                  : profile?.gender === "female"
                  ? "Femme"
                  : "Non renseigné"
              }
            />
            <InfoItem
              icon={<Droplet />}
              label="Groupe sanguin"
              value={profile?.bloodType || "Non renseigné"}
            />
            <InfoItem
              icon={<IdCard />}
              label="CIN"
              value={profile?.cin || "Non renseigné"}
            />
            <div className={styles.infoItemFull}>
              <MapPin className={styles.infoIcon} />
              <div className={styles.infoContent}>
                <p className={styles.infoLabel}>Adresse</p>
                <p className={styles.infoValue}>
                  {profile?.address || "Non renseignée"}
                  {profile?.city && `, ${profile.city}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// InfoItem Component
const InfoItem = ({ icon, label, value }) => (
  <div className={styles.infoItem}>
    <div className={styles.infoIcon}>{icon}</div>
    <div className={styles.infoContent}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  </div>
);

export default ProfileView;
