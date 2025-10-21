import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchDoctors, deleteDoctor, setFilters } from "./doctorsSlice";
import Loader from "../../components/Loader";
import DoctorModal from "./DoctorModal";
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import styles from "./Doctors.module.css";

const DoctorsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { doctors, loading, error, filters } = useSelector(
    (state) => state.doctors
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    console.log("🔍 === DOCTORS PAGE DEBUG ===");
    console.log("1. Checking token...");
    const token = localStorage.getItem("token");
    console.log("   Token exists:", !!token);

    if (!token) {
      console.error("❌ NO TOKEN! Redirecting to login...");
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    console.log("2. Dispatching fetchDoctors...");
    dispatch(fetchDoctors());
  }, [dispatch, navigate]);

  useEffect(() => {
    console.log("📊 Redux State Updated:");
    console.log("   - Doctors count:", doctors?.length);
    console.log("   - Loading:", loading);
    console.log("   - Error:", error);
    console.log("   - Doctors:", doctors);
  }, [doctors, loading, error]);

  useEffect(() => {
    if (error) {
      console.error("❌ Error detected:", error);
      toast.error(error);
    }
  }, [error]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      try {
        console.log("🗑️ Deleting doctor:", id);
        await dispatch(deleteDoctor(id)).unwrap();
        toast.success("Doctor deleted successfully");
      } catch (err) {
        console.error("❌ Delete error:", err);
        toast.error(err);
      }
    }
  };

  const handleView = (doctor) => {
    console.log("👁️ Viewing doctor:", doctor._id);
    navigate(`/doctors/profile/${doctor._id}`);
  };

  const handleAdd = () => {
    console.log("➕ Opening add modal");
    setSelectedDoctor(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (doctor) => {
    console.log("✏️ Opening edit modal for:", doctor._id);
    setSelectedDoctor(doctor);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleSpecialtyFilter = (e) => {
    console.log("🔍 Specialty filter changed to:", e.target.value);
    dispatch(setFilters({ specialty: e.target.value }));
  };

  // Filter doctors safely
  const searchValue = (filters.search || "").toLowerCase();
  const filteredDoctors = Array.isArray(doctors)
    ? doctors.filter((doctor) => {
        const name = (doctor.name || "").toLowerCase();
        const email = (doctor.email || "").toLowerCase();
        const specialty = (doctor.specialty || "").toLowerCase();

        const matchesSearch =
          name.includes(searchValue) ||
          email.includes(searchValue) ||
          specialty.includes(searchValue);

        const matchesSpecialty =
          filters.specialty === "all" || doctor.specialty === filters.specialty;

        return matchesSearch && matchesSpecialty;
      })
    : [];

  console.log("🔍 Filtered doctors:", filteredDoctors.length);

  if (loading && doctors.length === 0) {
    return <Loader fullscreen />;
  }

  return (
    <div className={styles["doctors-page"]}>
      <div className={styles["page-header"]}>
        <h1>Doctors Management</h1>
        <button
          onClick={handleAdd}
          className={`${styles["btn"]} ${styles["btn-primary"]}`}
        >
          <FiPlus /> Add Doctor
        </button>
      </div>

      <div className={styles["card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search doctors..."
              value={filters.search || ""}
              onChange={handleSearch}
            />
          </div>

          <select
            value={filters.specialty || "all"}
            onChange={handleSpecialtyFilter}
            className={styles["specialty-select"]}
          >
            <option value="all">All Specialties</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Neurology">Neurology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="Radiology">Radiology</option>
            <option value="General">General</option>
          </select>
        </div>

        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Specialty</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(doctors) ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "red",
                    }}
                  >
                    ❌ Error: Doctors is not an array
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {loading ? "Loading doctors..." : "No doctors found"}
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => (
                  <tr key={doctor._id}>
                    <td>
                      {doctor.photo ? (
                        <img
                          src={`http://localhost:5000${doctor.photo}`}
                          alt={doctor.name}
                          className={styles["avatar-img"]}
                          onError={(e) => {
                            console.error("Image load error:", doctor.photo);
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className={styles["avatar"]}>
                          {doctor.name?.[0] || "?"}
                        </div>
                      )}
                    </td>
                    <td>{doctor.name || "N/A"}</td>
                    <td>{doctor.specialty || "N/A"}</td>
                    <td>{doctor.phone || "N/A"}</td>
                    <td>{doctor.email || "N/A"}</td>
                    <td>{doctor.experience || 0} years</td>
                    <td>
                      <span
                        className={`${styles["status-badge"]} ${
                          doctor.isActive
                            ? styles["active"]
                            : styles["inactive"]
                        }`}
                      >
                        {doctor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles["action-buttons"]}>
                        <button
                          onClick={() => handleView(doctor)}
                          className={styles["btn-icon"]}
                          title="View Profile"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleEdit(doctor)}
                          className={styles["btn-icon"]}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(doctor._id)}
                          className={`${styles["btn-icon"]} ${styles["btn-danger"]}`}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <DoctorModal
          doctor={selectedDoctor}
          viewMode={viewMode}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DoctorsPage;
