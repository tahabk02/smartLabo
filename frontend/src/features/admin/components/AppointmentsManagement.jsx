// frontend/src/features/admin/components/AppointmentsManagement.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAppointments,
  confirmAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
  setFilters,
  selectFilteredAppointments,
  selectAppointmentsStats,
  selectAppointmentsLoading,
} from "../../appointments/appointmentsSlice";

const AppointmentsManagement = () => {
  const dispatch = useDispatch();

  // Récupérer les données depuis Redux
  const appointments = useSelector(selectFilteredAppointments);
  const stats = useSelector(selectAppointmentsStats);
  const loading = useSelector(selectAppointmentsLoading);
  const filters = useSelector((state) => state.appointments.filters);

  useEffect(() => {
    dispatch(fetchAllAppointments(filters));
  }, [dispatch]);

  const handleStatusUpdate = (id, action) => {
    if (action === "confirm") {
      dispatch(confirmAppointment(id));
    } else if (action === "cancel") {
      if (window.confirm("Annuler ce rendez-vous ?")) {
        dispatch(cancelAppointment(id));
      }
    } else if (action === "complete") {
      dispatch(completeAppointment(id));
    }
  };

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
    dispatch(fetchAllAppointments({ ...filters, ...newFilters }));
  };

  return (
    <div>
      <h1>Gestion des Rendez-vous</h1>

      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange({ status: e.target.value })}
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmés</option>
          <option value="completed">Terminés</option>
          <option value="cancelled">Annulés</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="stats">
        <div>Total: {stats.total}</div>
        <div>En attente: {stats.pending}</div>
        <div>Confirmés: {stats.confirmed}</div>
        <div>Terminés: {stats.completed}</div>
        <div>Annulés: {stats.cancelled}</div>
      </div>

      {/* Liste des rendez-vous */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div>
          {appointments.map((apt) => (
            <div key={apt._id} className={`appointment-card ${apt.status}`}>
              <h3>{apt.patient?.name}</h3>
              <p>Date: {new Date(apt.date).toLocaleDateString()}</p>
              <p>Heure: {new Date(apt.date).toLocaleTimeString()}</p>
              <p>
                Statut:{" "}
                <span className={`status-${apt.status}`}>{apt.status}</span>
              </p>

              <div className="actions">
                {apt.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate(apt._id, "confirm")}
                  >
                    Confirmer
                  </button>
                )}
                {apt.status === "confirmed" && (
                  <button
                    onClick={() => handleStatusUpdate(apt._id, "complete")}
                  >
                    Terminer
                  </button>
                )}
                {["pending", "confirmed"].includes(apt.status) && (
                  <button onClick={() => handleStatusUpdate(apt._id, "cancel")}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;
