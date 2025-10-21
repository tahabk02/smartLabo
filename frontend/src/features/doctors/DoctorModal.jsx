import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createDoctor, updateDoctor } from "./doctorsSlice";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import styles from "./Doctors.module.css";

const DoctorModal = ({ doctor, viewMode, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    specialty: "",
    phone: "",
    email: "",
    experience: "",
    qualification: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("📝 Modal opened with doctor:", doctor);
    if (doctor) {
      setFormData({
        name: doctor.name || "",
        specialty: doctor.specialty || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        experience: doctor.experience || "",
        qualification: doctor.qualification || "",
        address: doctor.address || "",
      });
    }
  }, [doctor]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("📤 Submitting form data:", formData);

    try {
      if (doctor) {
        // UPDATE MODE
        console.log("🔄 Updating doctor:", doctor._id);
        await dispatch(
          updateDoctor({ id: doctor._id, data: formData })
        ).unwrap();
        toast.success("Doctor updated successfully");
        console.log("✅ Doctor updated successfully");
      } else {
        // CREATE MODE
        console.log("➕ Creating new doctor");
        await dispatch(createDoctor(formData)).unwrap();
        toast.success("Doctor created successfully");
        console.log("✅ Doctor created successfully");
      }
      onClose();
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      toast.error(err || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>
            {viewMode
              ? "Doctor Details"
              : doctor
              ? "Edit Doctor"
              : "Add New Doctor"}
          </h2>
          <button onClick={onClose} className={styles["modal-close"]}>
            <FiX />
          </button>
        </div>

        {viewMode ? (
          <div className={styles["doctor-details"]}>
            <div className={styles["detail-row"]}>
              <strong>Name:</strong> <span>{doctor.name}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Specialty:</strong> <span>{doctor.specialty}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Phone:</strong> <span>{doctor.phone || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Email:</strong> <span>{doctor.email || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Experience:</strong>{" "}
              <span>{doctor.experience || 0} years</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Qualification:</strong>{" "}
              <span>{doctor.qualification || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Address:</strong> <span>{doctor.address || "N/A"}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={styles["form-control"]}
                  placeholder="Dr. John Doe"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Specialty *</label>
                <select
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  required
                  className={styles["form-control"]}
                >
                  <option value="">Select Specialty</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Radiology">Radiology</option>
                  <option value="General">General</option>
                </select>
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={styles["form-control"]}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={styles["form-control"]}
                  placeholder="doctor@example.com"
                />
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label>Experience (years) *</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  min="0"
                  className={styles["form-control"]}
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  className={styles["form-control"]}
                  placeholder="MD, PhD"
                />
              </div>
            </div>

            <div className={styles["form-group"]}>
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={styles["form-control"]}
                rows="3"
                placeholder="Enter address"
              />
            </div>

            <div className={styles["modal-actions"]}>
              <button
                type="button"
                onClick={onClose}
                className={`${styles["btn"]} ${styles["btn-secondary"]}`}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`${styles["btn"]} ${styles["btn-primary"]}`}
                disabled={loading}
              >
                {loading ? "Saving..." : doctor ? "Update" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DoctorModal;
