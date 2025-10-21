import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createPatient, updatePatient } from "./patientsSlice";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import styles from "./Patients.module.css";
const PatientModal = ({ patient, viewMode, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "male",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    medicalHistory: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || "",
        age: patient.age || "",
        gender: patient.gender || "male",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        bloodType: patient.bloodType || "",
        medicalHistory: patient.medicalHistory || "",
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (patient) {
        await dispatch(
          updatePatient({ id: patient._id, patientData: formData })
        ).unwrap();
        toast.success("Patient updated successfully");
      } else {
        await dispatch(createPatient(formData)).unwrap();
        toast.success("Patient created successfully");
      }
      onClose();
    } catch (err) {
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
              ? "Patient Details"
              : patient
              ? "Edit Patient"
              : "Add New Patient"}
          </h2>
          <button onClick={onClose} className={styles["modal-close"]}>
            <FiX />
          </button>
        </div>

        {viewMode ? (
          <div className={styles["patient-details"]}>
            <div className={styles["detail-row"]}>
              <strong>Name:</strong> <span>{patient?.name}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Age:</strong> <span>{patient?.age}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Gender:</strong> <span>{patient?.gender}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Phone:</strong> <span>{patient?.phone || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Email:</strong> <span>{patient?.email || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Blood Type:</strong>{" "}
              <span>{patient?.bloodType || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Address:</strong> <span>{patient?.address || "N/A"}</span>
            </div>
            <div className={styles["detail-row"]}>
              <strong>Medical History:</strong>
              <p>{patient?.medicalHistory || "No medical history"}</p>
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
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  min="0"
                  max="150"
                  className={styles["form-control"]}
                  placeholder="Enter age"
                />
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className={styles["form-control"]}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label>Blood Type</label>
                <select
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className={styles["form-control"]}
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            <div className={styles["form-row"]}>
              <div className={styles["form-group"]}>
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles["form-control"]}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles["form-control"]}
                  placeholder="patient@example.com"
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
                rows="2"
                placeholder="Enter address"
              />
            </div>

            <div className={styles["form-group"]}>
              <label>Medical History</label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                className={styles["form-control"]}
                rows="3"
                placeholder="Enter medical history"
              />
            </div>

            <div className={styles["modal-actions"]}>
              <button
                type="button"
                onClick={onClose}
                className={styles["btn"] + " " + styles["btn-secondary"]}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles["btn"] + " " + styles["btn-primary"]}
                disabled={loading}
              >
                {loading ? "Saving..." : patient ? "Update" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientModal;
