import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  deleteUser,
  toggleUserStatus,
  setFilters,
} from "./usersSlice";

import UserModal from "./UserModal";
import Loader from "../../components/Loader";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiUserX,
  FiUserCheck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import styles from "./Users.module.css";

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error, filters } = useSelector(
    (state) => state.users
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        toast.success("User deleted successfully");
      } catch (err) {
        toast.error(err);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await dispatch(toggleUserStatus(id)).unwrap();
      toast.success("User status updated");
    } catch (err) {
      toast.error(err);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleRoleFilter = (e) => {
    dispatch(setFilters({ role: e.target.value }));
  };

  const handleStatusFilter = (e) => {
    dispatch(setFilters({ status: e.target.value }));
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name?.toLowerCase() || "").includes(filters.search.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(filters.search.toLowerCase());
    const matchesRole = filters.role === "all" || user.role === filters.role;
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && user.isActive) ||
      (filters.status === "inactive" && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading && users.length === 0) {
    return <Loader fullscreen />;
  }

  return (
    <div className={styles["users-page"]}>
      <div className={styles["page-header"]}>
        <h1>Users Management</h1>
        <button
          onClick={handleAdd}
          className={styles["btn"] + " " + styles["btn-primary"]}
        >
          <FiPlus /> Add User
        </button>
      </div>

      <div className={styles["card"]}>
        <div className={styles["filters-row"]}>
          <div className={styles["search-box"]}>
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          <select value={filters.role} onChange={handleRoleFilter}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="lab_tech">Lab Tech</option>
          </select>

          <select value={filters.status} onChange={handleStatusFilter}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className={styles["table-container"]}>
          <table className={styles["table"]}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className={styles["user-info"]}>
                        <div className={styles["avatar"]}>
                          {user.name?.[0] || "?"}
                        </div>
                        <span>{user.name || "N/A"}</span>
                      </div>
                    </td>
                    <td>{user.email || "N/A"}</td>
                    <td>
                      <span className={`badge badge-${user.role}`}>
                        {user.role || "N/A"}
                      </span>
                    </td>
                    <td>{user.phone || "N/A"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          user.isActive ? "active" : "inactive"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <div className={styles["action-buttons"]}>
                        <button
                          onClick={() => handleToggleStatus(user._id)}
                          className={styles["btn-icon"]}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {user.isActive ? <FiUserX /> : <FiUserCheck />}
                        </button>
                        <button
                          onClick={() => handleEdit(user)}
                          className={styles["btn-icon"]}
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
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
        <UserModal
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UsersPage;
