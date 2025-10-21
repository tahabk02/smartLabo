const AppointmentCard = ({
  appointment,
  onConfirm,
  onCancel,
  onDelete,
  userRole,
}) => {
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: "En attente",
      confirmed: "Confirmé",
      cancelled: "Annulé",
      completed: "Complété",
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="appointment-card">
      <div className="card-header">
        <div className="patient-info">
          <h3>
            {appointment.patient?.nom} {appointment.patient?.prenom}
          </h3>
          <p className="patient-id">ID: {appointment.patient?.numeroPatient}</p>
        </div>
        <span className={`status-badge ${getStatusClass(appointment.status)}`}>
          {getStatusBadge(appointment.status)}
        </span>
      </div>

      <div className="card-body">
        <div className="appointment-details">
          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">{formatDate(appointment.date)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Analyses:</span>
            <div className="analyses-list">
              {appointment.analyses?.map((analyse, idx) => (
                <span key={idx} className="analysis-tag">
                  {analyse}
                </span>
              ))}
            </div>
          </div>
          {appointment.notes && (
            <div className="detail-row">
              <span className="label">Notes:</span>
              <span className="value">{appointment.notes}</span>
            </div>
          )}
          {appointment.facture && (
            <div className="detail-row">
              <span className="label">Facture:</span>
              <span className="value facture-link">
                {appointment.facture.numeroFacture}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card-footer">
        {["admin", "doctor", "nurse"].includes(userRole) && (
          <>
            {appointment.status === "pending" && (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => onConfirm(appointment._id)}
                >
                  Confirmer
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => onCancel(appointment._id)}
                >
                  Annuler
                </button>
              </>
            )}
            {appointment.status === "confirmed" && (
              <button
                className="btn btn-warning"
                onClick={() => onCancel(appointment._id)}
              >
                Annuler
              </button>
            )}
            {userRole === "admin" && (
              <button
                className="btn btn-danger"
                onClick={() => onDelete(appointment._id)}
              >
                Supprimer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;
