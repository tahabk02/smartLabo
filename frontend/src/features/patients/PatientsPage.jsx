import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // 🆕 Import
import { fetchPatients, deletePatient, setFilters } from "./patientsSlice";
import PatientModal from "./PatientModal";
import Loader from "../../components/Loader";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiUser,
} from "react-icons/fi"; // 🆕 FiUser
import { toast } from "react-toastify";
import styles from "./Patients.module.css";

const PatientsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // 🆕 Hook
  const { patients, loading, error, filters } = useSelector(
    (state) => state.patients
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewMode, setViewMode] = useState(false);

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      try {
        await dispatch(deletePatient(id)).unwrap();
        toast.success("Patient deleted successfully");
      } catch (err) {
        toast.error(err);
      }
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setViewMode(true);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPatient(null);
    setViewMode(false);
    setIsModalOpen(true);
  };

  // 🆕 Fonction pour ouvrir le profil
  const handleViewProfile = (patientId) => {
    navigate(`/patients/${patientId}/profile`);
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleGenderFilter = (e) => {
    dispatch(setFilters({ gender: e.target.value }));
  };

  // Filter patients
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      patient.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      patient.phone?.includes(filters.search) ||
      patient.queueNumber?.toString().includes(filters.search);
    const matchesGender =
      filters.gender === "all" || patient.gender === filters.gender;

    return matchesSearch && matchesGender;
  });

  if (loading && patients.length === 0) {
    return <Loader fullscreen />;
  }

  return (
    <div className={styles["patients-page"]}>
      <div className={styles["page-header"]}>
        <h1>Patients Management</h1>
        <button
          onClick={handleAdd}
          className={styles["btn"] + " " + styles["btn-primary"]}
        >
          <FiPlus /> Add Patient
        </button>
      </div>

      <div className={styles["card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search patients..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          <select value={filters.gender} onChange={handleGenderFilter}>
            <option value="all">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>File N°</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Blood Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No patients found
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <span className={styles["queue-number"]}>
                        {patient.queueNumber || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className={styles["patient-info"]}>
                        <div className={styles["avatar"]}>
                          {patient.name?.[0]}
                        </div>
                        <span>{patient.name}</span>
                      </div>
                    </td>
                    <td>{patient.age}</td>
                    <td>
                      <span className={`badge badge-${patient.gender}`}>
                        {patient.gender}
                      </span>
                    </td>
                    <td>{patient.phone || "N/A"}</td>
                    <td>{patient.email || "N/A"}</td>
                    <td>
                      <span className={styles["blood-type"]}>
                        {patient.bloodType || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className={styles["action-buttons"]}>
                        {/* 🆕 Bouton Profile */}
                        <button
                          onClick={() => handleViewProfile(patient._id)}
                          className={
                            styles["btn-icon"] + " " + styles["btn-profile"]
                          }
                          title="View Full Profile"
                        >
                          <FiUser />
                        </button>
                        <button
                          onClick={() => handleView(patient)}
                          className={styles["btn-icon"]}
                          title="Quick View"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className={styles["btn-icon"]}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(patient._id)}
                          className={
                            styles["btn-icon"] + " " + styles["btn-danger"]
                          }
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
        <PatientModal
          patient={selectedPatient}
          viewMode={viewMode}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatient(null);
            setViewMode(false);
          }}
        />
      )}
    </div>
  );
};

export default PatientsPage;
