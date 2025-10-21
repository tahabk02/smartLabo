// src/features/appointments/components/AppointmentsList.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAppointments,
  fetchAppointmentsByPatient,
  confirmAppointment,
  cancelAppointment,
  deleteAppointment,
  clearError,
  clearSuccess,
} from "../appointmentsSlice";
import { useAuth } from "../../../hooks/useAuth";
import "./AppointmentsList.css";

const AppointmentsList = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { appointments, loading, error, success, message } = useSelector(
    (state) => state.appointments
  );
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.role === "patient") {
      dispatch(fetchAppointmentsByPatient(user.id));
    } else {
      dispatch(fetchAllAppointments());
    }
  }, [dispatch, user]);

  const handleConfirm = (appointmentId) => {
    if (window.confirm("Confirmer ce rendez-vous ?")) {
      dispatch(confirmAppointment(appointmentId));
    }
  };

  const handleCancel = (appointmentId) => {
    if (window.confirm("Annuler ce rendez-vous ?")) {
      dispatch(cancelAppointment(appointmentId));
    }
  };

  const handleDelete = (appointmentId) => {
    if (window.confirm("Supprimer ce rendez-vous ?")) {
      dispatch(deleteAppointment(appointmentId));
    }
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => dispatch(clearSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = filter === "all" || apt.status === filter;
    const matchesSearch =
      apt.patient?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.numeroPatient?.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>Rendez-vous</h1>
        {user?.role === "patient" && (
          <button className="btn-primary">+ Nouveau RDV</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{message}</div>}

      <div className="appointments-controls">
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="cancelled">Annulé</option>
          <option value="completed">Complété</option>
        </select>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="no-data">Aucun rendez-vous trouvé</div>
      ) : (
        <div className="appointments-grid">
          {filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onDelete={handleDelete}
              userRole={user?.role}
            />
          ))}
        </div>
      )}
    </div>
  );
};
