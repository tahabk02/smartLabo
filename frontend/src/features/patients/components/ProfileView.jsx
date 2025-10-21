// src/features/patients/components/ProfileView.jsx

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
} from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./ProfileView.module.css";

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await patientApi.getProfile();
      setProfile(data);
      setFormData({
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        emergencyContact: data.emergencyContact || {
          name: "",
          phone: "",
          relationship: "",
        },
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await patientApi.updateProfile(formData);
      alert("✅ Profil mis à jour avec succès");
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      alert("❌ Erreur lors de la mise à jour du profil");
    }
  };

  const handleCancel = () => {
    setFormData({
      phone: profile.phone || "",
      address: profile.address || "",
      city: profile.city || "",
      emergencyContact: profile.emergencyContact || {
        name: "",
        phone: "",
        relationship: "",
      },
    });
    setIsEditing(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <ErrorMessage message="Impossible de charger le profil" />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Mon Profil</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </button>
        )}
      </div>

      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileContent}>
          <div className={styles.avatar}>
            <User className={styles.avatarIcon} />
          </div>
          <div className={styles.profileInfo}>
            <h3>
              {profile.firstName} {profile.lastName}
            </h3>
            <p className={styles.profileSubtext}>
              N° Patient: {profile.numeroPatient}
            </p>
            {profile.prescribedBy && (
              <p className={styles.profileSubtext}>
                Médecin traitant: Dr. {profile.prescribedBy.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Téléphone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Ville *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className={styles.input}
                required
              />
            </div>

            <div className={`${styles.formField} ${styles.fullWidth}`}>
              <label className={styles.label}>Adresse *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className={styles.input}
                required
              />
            </div>

            <div className={styles.emergencySection}>
              <h4 className={styles.emergencyTitle}>Contact d'urgence</h4>
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Nom</label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: {
                      ...formData.emergencyContact,
                      name: e.target.value,
                    },
                  })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Téléphone</label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: {
                      ...formData.emergencyContact,
                      phone: e.target.value,
                    },
                  })
                }
                className={styles.input}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Relation</label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergencyContact: {
                      ...formData.emergencyContact,
                      relationship: e.target.value,
                    },
                  })
                }
                placeholder="Ex: Époux(se), Parent, Ami(e)"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
            <button type="submit" className={styles.saveButton}>
              <Save className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </form>
      ) : (
        /* Display Profile */
        <>
          <div className={styles.infoSection}>
            <h3 className={styles.sectionTitle}>Informations personnelles</h3>
            <div className={styles.infoGrid}>
              <InfoItem
                icon={<User className="w-5 h-5 text-gray-400" />}
                label="Nom complet"
                value={`${profile.firstName} ${profile.lastName}`}
              />
              <InfoItem
                icon={<Mail className="w-5 h-5 text-gray-400" />}
                label="Email"
                value={profile.email}
              />
              <InfoItem
                icon={<Phone className="w-5 h-5 text-gray-400" />}
                label="Téléphone"
                value={profile.phone}
              />
              <InfoItem
                icon={<Calendar className="w-5 h-5 text-gray-400" />}
                label="Date de naissance"
                value={
                  profile.birthDate
                    ? new Date(profile.birthDate).toLocaleDateString("fr-FR")
                    : "Non renseignée"
                }
              />
              <InfoItem
                icon={<User className="w-5 h-5 text-gray-400" />}
                label="Sexe"
                value={
                  profile.gender === "male"
                    ? "Homme"
                    : profile.gender === "female"
                    ? "Femme"
                    : "Non renseigné"
                }
              />
              <InfoItem
                icon={<User className="w-5 h-5 text-gray-400" />}
                label="Groupe sanguin"
                value={profile.bloodType || "Non renseigné"}
              />
              <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                <MapPin
                  className={`${styles.infoIcon} w-5 h-5 text-gray-400`}
                />
                <div className={styles.infoContent}>
                  <p className={styles.infoLabel}>Adresse</p>
                  <p className={styles.infoValue}>
                    {`${profile.address || "Non renseignée"}, ${
                      profile.city || ""
                    }`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {profile.emergencyContact && (
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>Contact d'urgence</h3>
              <div className={`${styles.infoGrid} ${styles.threeColumns}`}>
                <InfoItem
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  label="Nom"
                  value={profile.emergencyContact.name || "Non renseigné"}
                />
                <InfoItem
                  icon={<Phone className="w-5 h-5 text-gray-400" />}
                  label="Téléphone"
                  value={profile.emergencyContact.phone || "Non renseigné"}
                />
                <InfoItem
                  icon={<User className="w-5 h-5 text-gray-400" />}
                  label="Relation"
                  value={
                    profile.emergencyContact.relationship || "Non renseignée"
                  }
                />
              </div>
            </div>
          )}
        </>
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

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
  </div>
);

// ErrorMessage Component
const ErrorMessage = ({ message }) => (
  <div className={styles.errorMessage}>{message}</div>
);

export default ProfileView;
