import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoctorById, clearCurrentDoctor } from "./doctorsSlice";
import { toast } from "react-toastify";

import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiEdit,
  FiUser,
  FiClock,
  FiDollarSign,
  FiActivity,
  FiAlertCircle,
} from "react-icons/fi";
import styles from "./Doctors.module.css";
import Loader from "../../components/Loader";

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Redux state - FIXED: Using correct property names
  const { currentDoctor, loading, error } = useSelector(
    (state) => state.doctors
  );

  // ✅ Fetch doctor on mount
  useEffect(() => {
    if (id) {
      console.log("🔍 Fetching doctor profile:", id);
      dispatch(fetchDoctorById(id));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearCurrentDoctor());
    };
  }, [dispatch, id]);

  // ✅ Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      console.error("❌ Error loading doctor:", error);
    }
  }, [error]);

  // ✅ Loading
  if (loading) {
    return <Loader fullscreen message="Chargement du profil..." />;
  }

  // ✅ Error state
  if (!loading && !currentDoctor && error) {
    return (
      <div className={styles["doctor-profile-page"]}>
        <div className={styles["error-state"]}>
          <FiAlertCircle className={styles["error-icon"]} />
          <h2>Docteur introuvable</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate("/doctors")}
            className={styles["btn-primary"]}
          >
            <FiArrowLeft /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ✅ Not found
  if (!currentDoctor) {
    return (
      <div className={styles["doctor-profile-page"]}>
        <div className={styles["error-state"]}>
          <FiAlertCircle className={styles["error-icon"]} />
          <h2>Docteur introuvable</h2>
          <p>Le profil demandé n'existe pas.</p>
          <button
            onClick={() => navigate("/doctors")}
            className={styles["btn-primary"]}
          >
            <FiArrowLeft /> Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  // ✅ Main UI
  return (
    <div className={styles["doctor-profile-page"]}>
      {/* Header */}
      <div className={styles["profile-header"]}>
        <button
          onClick={() => navigate("/doctors")}
          className={styles["btn-back"]}
        >
          <FiArrowLeft /> Retour
        </button>
        <button
          onClick={() => navigate(`/doctors/edit/${currentDoctor._id}`)}
          className={styles["btn"] + " " + styles["btn-primary"]}
        >
          <FiEdit /> Modifier le profil
        </button>
      </div>

      {/* Profile Card */}
      <div className={styles["profile-card"]}>
        <div className={styles["profile-banner"]}>
          <div className={styles["banner-gradient"]}></div>
        </div>

        <div className={styles["profile-content"]}>
          <div className={styles["profile-avatar-section"]}>
            {/* Photo or Avatar */}
            {currentDoctor.photo ? (
              <img
                src={`http://localhost:5000${currentDoctor.photo}`}
                alt={currentDoctor.name}
                className={styles["avatar-large-img"]}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={styles["avatar-large"]}
              style={{ display: currentDoctor.photo ? "none" : "flex" }}
            >
              {currentDoctor.name?.[0]?.toUpperCase() || "?"}
            </div>

            <div className={styles["profile-basic-info"]}>
              <h1>{currentDoctor.name || "N/A"}</h1>
              <p className={styles["specialty"]}>
                <FiAward /> {currentDoctor.specialty || "Non spécifié"}
              </p>
              <span
                className={`status-pill ${
                  currentDoctor.isActive ? "active" : "inactive"
                }`}
              >
                {currentDoctor.isActive ? "● Actif" : "● Inactif"}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className={styles["contact-cards"]}>
            <div className={styles["contact-card"]}>
              <FiMail className={styles["contact-icon"]} />
              <div>
                <span className={styles["contact-label"]}>Email</span>
                <a
                  href={`mailto:${currentDoctor.email}`}
                  className={styles["contact-value"]}
                >
                  {currentDoctor.email || "N/A"}
                </a>
              </div>
            </div>
            <div className={styles["contact-card"]}>
              <FiPhone className={styles["contact-icon"]} />
              <div>
                <span className={styles["contact-label"]}>Téléphone</span>
                <a
                  href={`tel:${currentDoctor.phone}`}
                  className={styles["contact-value"]}
                >
                  {currentDoctor.phone || "N/A"}
                </a>
              </div>
            </div>
            <div className={styles["contact-card"]}>
              <FiMapPin className={styles["contact-icon"]} />
              <div>
                <span className={styles["contact-label"]}>Adresse</span>
                <span className={styles["contact-value"]}>
                  {currentDoctor.address || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className={styles["details-grid"]}>
        {/* Professional Information */}
        <div className={styles["card"] + " " + styles["details-card"]}>
          <h3 className={styles["card-title"]}>
            <FiUser /> Informations professionnelles
          </h3>
          <div className={styles["details-list"]}>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiAward /> Spécialisation
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.specialty || "N/A"}
              </span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiCalendar /> Expérience
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.experience || 0} ans
              </span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiAward /> Qualification
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.qualification || "N/A"}
              </span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiActivity /> Statut
              </span>
              <span
                className={`status-badge ${
                  currentDoctor.isActive ? "active" : "inactive"
                }`}
              >
                {currentDoctor.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        {/* Consultation Info */}
        <div className={styles["card"] + " " + styles["details-card"]}>
          <h3 className={styles["card-title"]}>
            <FiClock /> Détails de consultation
          </h3>
          <div className={styles["details-list"]}>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiDollarSign /> Frais de consultation
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.consultationFee
                  ? `${currentDoctor.consultationFee} DH`
                  : "N/A"}
              </span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiPhone /> Téléphone
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.phone || "N/A"}
              </span>
            </div>
            <div className={styles["detail-item"]}>
              <span className={styles["detail-label"]}>
                <FiMail /> Email
              </span>
              <span className={styles["detail-value"]}>
                {currentDoctor.email || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        {currentDoctor.address && (
          <div
            className={
              styles["card"] +
              " " +
              styles["details-card"] +
              " " +
              styles["bio-card"]
            }
          >
            <h3 className={styles["card-title"]}>
              <FiMapPin /> Adresse
            </h3>
            <p className={styles["bio-text"]}>{currentDoctor.address}</p>
          </div>
        )}

        {/* Schedule - If available */}
        {currentDoctor.schedule &&
          Object.keys(currentDoctor.schedule).length > 0 && (
            <div className={styles["card"] + " " + styles["details-card"]}>
              <h3 className={styles["card-title"]}>
                <FiClock /> Horaires de travail
              </h3>
              <div className={styles["schedule-list"]}>
                {Object.entries(currentDoctor.schedule).map(
                  ([day, hours]) =>
                    hours &&
                    hours.length > 0 && (
                      <div key={day} className={styles["schedule-item"]}>
                        <span className={styles["schedule-day"]}>{day}</span>
                        <span className={styles["schedule-hours"]}>
                          {hours.map((h, i) => (
                            <span key={i}>
                              {h.start} - {h.end}
                            </span>
                          ))}
                        </span>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

        {/* Statistics */}
        <div className={styles["card"] + " " + styles["stats-card"]}>
          <h3 className={styles["card-title"]}>
            <FiActivity /> Statistiques
          </h3>
          <div className={styles["stats-grid"]}>
            <div className={styles["stat-box"]}>
              <div className={styles["stat-value"]}>
                {currentDoctor.totalPatients || 0}
              </div>
              <div className={styles["stat-label"]}>Patients totaux</div>
            </div>
            <div className={styles["stat-box"]}>
              <div className={styles["stat-value"]}>
                {currentDoctor.totalConsultations || 0}
              </div>
              <div className={styles["stat-label"]}>Consultations</div>
            </div>
            <div className={styles["stat-box"]}>
              <div className={styles["stat-value"]}>
                {currentDoctor.experience || 0}
              </div>
              <div className={styles["stat-label"]}>Années d'expérience</div>
            </div>
            <div className={styles["stat-box"]}>
              <div className={styles["stat-value"]}>
                {currentDoctor.consultationFee
                  ? `${currentDoctor.consultationFee} DH`
                  : "N/A"}
              </div>
              <div className={styles["stat-label"]}>Frais consultation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
