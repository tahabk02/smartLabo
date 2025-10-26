// src/features/patients/components/PatientAppointmentsView.jsx

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Eye,
  Calendar,
  Plus,
  X,
  Clock,
  User,
  TestTube,
  Search,
  Filter,
  Download,
  Trash2,
} from "lucide-react";
import {
  fetchAppointmentsByPatient,
  createAppointment,
  cancelAppointment,
  fetchAppointmentById,
  clearError,
  clearSuccess,
} from "../../appointments/appointmentsSlice";

const PatientAppointmentsView = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { appointments, currentAppointment, loading, error, success, message } =
    useSelector((state) => state.appointments);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newAppointment, setNewAppointment] = useState({
    date: "",
    time: "",
    type: "consultation",
    notes: "",
  });

  useEffect(() => {
    if (user?._id) {
      dispatch(fetchAppointmentsByPatient(user._id));
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const appointmentData = {
      patient: user._id,
      date: `${newAppointment.date}T${newAppointment.time}`,
      type: newAppointment.type,
      notes: newAppointment.notes,
      status: "pending",
    };

    dispatch(createAppointment(appointmentData)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setShowCreateModal(false);
        setNewAppointment({
          date: "",
          time: "",
          type: "consultation",
          notes: "",
        });
      }
    });
  };

  const handleCancelAppointment = (appointmentId) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      dispatch(cancelAppointment(appointmentId));
    }
  };

  const handleViewDetails = (appointmentId) => {
    dispatch(fetchAppointmentById(appointmentId)).then((result) => {
      if (result.meta.requestStatus === "fulfilled") {
        setSelectedAppointment(currentAppointment);
        setShowDetailsModal(true);
      }
    });
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    const texts = {
      pending: "En attente",
      confirmed: "Confirmé",
      completed: "Terminé",
      cancelled: "Annulé",
      no_show: "Non honoré",
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Générer des créneaux horaires disponibles
  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      timeSlots.push(timeString);
    }
  }

  if (loading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec notifications */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Rendez-vous</h1>
          <p className="text-gray-600">
            Gérez vos rendez-vous et consultations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Rendez-vous
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <X className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Calendar className="w-5 h-5" />
            <p>{message}</p>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un rendez-vous..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="completed">Terminé</option>
          <option value="cancelled">Annulé</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {appointments.length}
          </div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {appointments.filter((a) => a.status === "pending").length}
          </div>
          <div className="text-sm text-gray-600">En attente</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {appointments.filter((a) => a.status === "confirmed").length}
          </div>
          <div className="text-sm text-gray-600">Confirmés</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">
            {appointments.filter((a) => a.status === "cancelled").length}
          </div>
          <div className="text-sm text-gray-600">Annulés</div>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow border">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {appointments.length === 0
                ? "Aucun rendez-vous"
                : "Aucun résultat"}
            </h3>
            <p className="text-gray-600 mb-4">
              {appointments.length === 0
                ? "Vous n'avez pas encore de rendez-vous programmé."
                : "Aucun rendez-vous ne correspond à votre recherche."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Prendre un rendez-vous
            </button>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onViewDetails={handleViewDetails}
              onCancel={handleCancelAppointment}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      {/* Modal de création */}
      {showCreateModal && (
        <CreateAppointmentModal
          newAppointment={newAppointment}
          setNewAppointment={setNewAppointment}
          timeSlots={timeSlots}
          onSubmit={handleCreateAppointment}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAppointment(null);
          }}
          onCancel={handleCancelAppointment}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Composant Carte de Rendez-vous
const AppointmentCard = ({
  appointment,
  onViewDetails,
  onCancel,
  getStatusColor,
  getStatusText,
  formatDate,
}) => {
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(appointment.date)}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">Type:</span>
                <span className="capitalize">{appointment.type}</span>
              </div>

              {appointment.doctor && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Avec: Dr. {appointment.doctor.name}</span>
                </div>
              )}

              {appointment.notes && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span>{" "}
                  {appointment.notes}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                appointment.status
              )}`}
            >
              {getStatusText(appointment.status)}
            </span>

            <div className="flex gap-2">
              <button
                onClick={() => onViewDetails(appointment._id)}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Détails
              </button>

              {canCancel && (
                <button
                  onClick={() => onCancel(appointment._id)}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de création de rendez-vous
const CreateAppointmentModal = ({
  newAppointment,
  setNewAppointment,
  timeSlots,
  onSubmit,
  onClose,
  loading,
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Nouveau Rendez-vous</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              required
              min={today}
              value={newAppointment.date}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  date: e.target.value,
                })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure
            </label>
            <select
              required
              value={newAppointment.time}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  time: e.target.value,
                })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez une heure</option>
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de rendez-vous
            </label>
            <select
              value={newAppointment.type}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  type: e.target.value,
                })
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="consultation">Consultation</option>
              <option value="blood_test">Prise de sang</option>
              <option value="scan">Scanner</option>
              <option value="follow_up">Suivi</option>
              <option value="emergency">Urgence</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={newAppointment.notes}
              onChange={(e) =>
                setNewAppointment({
                  ...newAppointment,
                  notes: e.target.value,
                })
              }
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez brièvement la raison de votre visite..."
            />
          </div>
        </form>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={!newAppointment.date || !newAppointment.time || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Création..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de détails du rendez-vous
const AppointmentDetailsModal = ({
  appointment,
  onClose,
  onCancel,
  getStatusColor,
  getStatusText,
  formatDate,
}) => {
  const canCancel =
    appointment.status === "pending" || appointment.status === "confirmed";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold">Détails du Rendez-vous</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold mb-3 text-lg">
              Informations générales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">
                  Date et heure:
                </span>
                <p className="mt-1 text-gray-900">
                  {formatDate(appointment.date)}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Statut:</span>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusText(appointment.status)}
                  </span>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="mt-1 text-gray-900 capitalize">
                  {appointment.type}
                </p>
              </div>
              {appointment.doctor && (
                <div>
                  <span className="font-medium text-gray-700">Médecin:</span>
                  <p className="mt-1 text-gray-900">
                    Dr. {appointment.doctor.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h4 className="font-semibold mb-2 text-lg">Notes</h4>
              <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Résultats si disponible */}
          {appointment.results && appointment.results.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Résultats</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Analyse
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Résultat
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointment.results.map((result, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2">{result.analysisName}</td>
                        <td className="px-4 py-2 font-medium">
                          {result.value} {result.unit}
                        </td>
                        <td className="px-4 py-2">
                          {result.isAbnormal ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                              Anormal
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between">
          {canCancel && (
            <button
              onClick={() => onCancel(appointment._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Annuler le rendez-vous
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientAppointmentsView;
