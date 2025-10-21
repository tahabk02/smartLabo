import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createUser, updateUser } from "./usersSlice";
import { toast } from "react-toastify";
import { FiX } from "react-icons/fi";
import styles from "./Users.module.css";
const UserModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "receptionist",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "receptionist",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

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
      if (user) {
        // Update
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        await dispatch(
          updateUser({ id: user._id, userData: updateData })
        ).unwrap();
        toast.success("User updated successfully");
      } else {
        // Create
        if (!formData.password) {
          toast.error("Password is required");
          setLoading(false);
          return;
        }
        await dispatch(createUser(formData)).unwrap();
        toast.success("User created successfully");
      }
      onClose();
    } catch (err) {
      toast.error(err || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2>{user ? "Edit User" : "Add New User"}</h2>
          <button onClick={onClose} className={styles["modal-close"]}>
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
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
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles["form-control"]}
              placeholder="user@example.com"
            />
          </div>

          <div className={styles["form-group"]}>
            <label>
              Password {user ? "(leave empty to keep current)" : "*"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!user}
              className={styles["form-control"]}
              placeholder="Enter password"
              minLength={6}
            />
          </div>

          <div className={styles["form-group"]}>
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className={styles["form-control"]}
            >
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
              <option value="lab_tech">Lab Technician</option>
            </select>
          </div>

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
              {loading ? "Saving..." : user ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
