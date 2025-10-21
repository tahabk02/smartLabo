// frontend/src/features/doctors/EditDoctor.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchDoctorById, updateDoctor } from "./doctorsSlice";
import { toast } from "react-toastify";
import { FiArrowLeft, FiSave, FiUpload } from "react-icons/fi";
import Loader from "../../components/Loader";
import styles from "./Doctors.module.css";

const EditDoctor = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentDoctor, loadingDoctor, error } = useSelector(
    (state) => state.doctors
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    specialization: "",
    experience: "",
    licenseNumber: "",
    consultationFee: "",
    workingHours: "",
    availableDays: [],
    bio: "",
    qualifications: [],
    isActive: true,
    photo: null,
  });

  const [preview, setPreview] = useState(null);

  // ✅ Charger le médecin à modifier
  useEffect(() => {
    if (id) {
      dispatch(fetchDoctorById(id));
    }
  }, [dispatch, id]);

  // ✅ Remplir le formulaire une fois le docteur chargé
  useEffect(() => {
    if (currentDoctor) {
      setFormData({
        name: currentDoctor.name || "",
        email: currentDoctor.email || "",
        phone: currentDoctor.phone || "",
        address: currentDoctor.address || "",
        specialization: currentDoctor.specialization || "",
        experience: currentDoctor.experience || "",
        licenseNumber: currentDoctor.licenseNumber || "",
        consultationFee: currentDoctor.consultationFee || "",
        workingHours: currentDoctor.workingHours || "",
        availableDays: currentDoctor.availableDays || [],
        bio: currentDoctor.bio || "",
        qualifications: currentDoctor.qualifications || [],
        isActive: currentDoctor.isActive || false,
        photo: null,
      });
      setPreview(currentDoctor.photo ? currentDoctor.photo : null);
    }
  }, [currentDoctor]);

  // ✅ Gérer les changements de champs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // ✅ Gérer les jours disponibles
  const handleDaysChange = (e) => {
    const days = e.target.value.split(",").map((d) => d.trim());
    setFormData({ ...formData, availableDays: days });
  };

  // ✅ Gérer les qualifications
  const handleQualificationsChange = (e) => {
    const quals = e.target.value.split(",").map((q) => q.trim());
    setFormData({ ...formData, qualifications: quals });
  };

  // ✅ Gérer la photo
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(updateDoctor({ id, data: formData })).unwrap();
      toast.success("Profil du docteur mis à jour avec succès !");
      navigate(`/doctors/${id}`);
    } catch (err) {
      toast.error(err || "Erreur lors de la mise à jour");
    }
  };

  if (loadingDoctor || !currentDoctor) {
    return <Loader fullscreen message="Chargement du profil..." />;
  }

  return (
    <div
      className={
        styles["edit-doctor-page"] +
        " " +
        styles["container"] +
        " " +
        styles["mx-auto"] +
        " " +
        styles["p-6"] +
        " " +
        styles["max-w-4xl"]
      }
    >
      <div
        className={
          styles["flex"] +
          " " +
          styles["items-center"] +
          " " +
          styles["justify-between"] +
          " " +
          styles["mb-6"]
        }
      >
        <button
          onClick={() => navigate(-1)}
          className={
            styles["flex"] +
            " " +
            styles["items-center"] +
            " " +
            styles["gap-2"] +
            " " +
            styles["text-gray-600"] +
            " " +
            styles["hover:text-blue-600"]
          }
        >
          <FiArrowLeft /> Retour
        </button>
        <h2
          className={
            styles["text-2xl"] +
            " " +
            styles["font-semibold"] +
            " " +
            styles["text-gray-800"]
          }
        >
          Modifier le profil du docteur
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className={
          styles["bg-white"] +
          " " +
          styles["p-6"] +
          " " +
          styles["rounded-2xl"] +
          " " +
          styles["shadow-lg"] +
          " " +
          styles["space-y-5"]
        }
      >
        {/* Photo */}
        <div
          className={
            styles["flex"] +
            " " +
            styles["items-center"] +
            " " +
            styles["gap-6"]
          }
        >
          <div
            className={
              styles["w-24"] +
              " " +
              styles["h-24"] +
              " " +
              styles["rounded-full"] +
              " " +
              styles["overflow-hidden"] +
              " " +
              styles["border"] +
              " " +
              styles["border-gray-300"]
            }
          >
            {preview ? (
              <img
                src={
                  preview.startsWith("blob:")
                    ? preview
                    : `http://localhost:5000/${preview}`
                }
                alt="Doctor"
                className={
                  styles["w-full"] +
                  " " +
                  styles["h-full"] +
                  " " +
                  styles["object-cover"]
                }
              />
            ) : (
              <div
                className={
                  styles["w-full"] +
                  " " +
                  styles["h-full"] +
                  " " +
                  styles["flex"] +
                  " " +
                  styles["items-center"] +
                  " " +
                  styles["justify-center"] +
                  " " +
                  styles["text-gray-400"]
                }
              >
                Aucun
              </div>
            )}
          </div>
          <label
            className={
              styles["flex"] +
              " " +
              styles["items-center"] +
              " " +
              styles["gap-2"] +
              " " +
              styles["cursor-pointer"] +
              " " +
              styles["text-blue-600"] +
              " " +
              styles["font-medium"]
            }
          >
            <FiUpload /> Changer la photo
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className={styles["hidden"]}
            />
          </label>
        </div>

        {/* Infos de base */}
        <div
          className={
            styles["grid"] + " " + styles["grid-cols-2"] + " " + styles["gap-4"]
          }
        >
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nom complet"
            className={styles["input"]}
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={styles["input"]}
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Téléphone"
            className={styles["input"]}
          />
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Adresse"
            className={styles["input"]}
          />
          <input
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="Spécialisation"
            className={styles["input"]}
          />
          <input
            name="experience"
            type="number"
            value={formData.experience}
            onChange={handleChange}
            placeholder="Expérience (années)"
            className={styles["input"]}
          />
          <input
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="Numéro de licence"
            className={styles["input"]}
          />
          <input
            name="consultationFee"
            type="number"
            value={formData.consultationFee}
            onChange={handleChange}
            placeholder="Frais de consultation"
            className={styles["input"]}
          />
          <input
            name="workingHours"
            value={formData.workingHours}
            onChange={handleChange}
            placeholder="Heures de travail (ex: 09h-17h)"
            className={styles["input"]}
          />
          <input
            name="availableDays"
            value={formData.availableDays.join(", ")}
            onChange={handleDaysChange}
            placeholder="Jours disponibles (ex: Lundi, Mardi)"
            className={styles["input"]}
          />
        </div>

        {/* Qualifications et bio */}
        <textarea
          name="qualifications"
          value={formData.qualifications.join(", ")}
          onChange={handleQualificationsChange}
          placeholder="Qualifications (séparées par des virgules)"
          className={styles["input"] + " " + styles["h-24"]}
        ></textarea>

        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          placeholder="Biographie"
          className={styles["input"] + " " + styles["h-32"]}
        ></textarea>

        {/* Statut */}
        <label
          className={
            styles["flex"] +
            " " +
            styles["items-center"] +
            " " +
            styles["gap-2"]
          }
        >
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          <span>Docteur actif</span>
        </label>

        <button
          type="submit"
          className={
            styles["w-full"] +
            " " +
            styles["py-3"] +
            " " +
            styles["bg-blue-600"] +
            " " +
            styles["text-white"] +
            " " +
            styles["rounded-lg"] +
            " " +
            styles["hover:bg-blue-700"] +
            " " +
            styles["flex"] +
            " " +
            styles["items-center"] +
            " " +
            styles["justify-center"] +
            " " +
            styles["gap-2"]
          }
        >
          <FiSave /> Enregistrer les modifications
        </button>
      </form>
    </div>
  );
};

export default EditDoctor;
