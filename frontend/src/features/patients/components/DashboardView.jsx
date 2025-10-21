// src/features/patients/components/DashboardView.jsx

import React, { useState, useEffect } from "react";
import { Activity, Clock, CheckCircle, DollarSign } from "lucide-react";
import patientApi from "../services/patientApi";

const DashboardView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await patientApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return <ErrorMessage message="Impossible de charger les statistiques" />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-8 h-8 text-blue-500" />}
          title="Total Analyses"
          value={stats.analyses.total}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="w-8 h-8 text-yellow-500" />}
          title="En attente"
          value={stats.analyses.pending}
          color="bg-yellow-50"
        />
        <StatCard
          icon={<CheckCircle className="w-8 h-8 text-green-500" />}
          title="Terminées"
          value={stats.analyses.completed}
          color="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="w-8 h-8 text-red-500" />}
          title="Factures impayées"
          value={`${stats.factures.unpaidAmount} MAD`}
          color="bg-red-50"
        />
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Dernières analyses</h3>
        <div className="space-y-3">
          {stats.recentAnalyses?.length > 0 ? (
            stats.recentAnalyses.map((analysis) => (
              <div
                key={analysis._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-medium">{analysis.analysisType?.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(analysis.requestDate).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <StatusBadge status={analysis.status} />
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              Aucune analyse récente
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ icon, title, value, color }) => (
  <div className={`${color} rounded-lg p-6 shadow-sm`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      {icon}
    </div>
  </div>
);

// StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
    sample_collected: {
      label: "Échantillon collecté",
      color: "bg-blue-100 text-blue-800",
    },
    in_progress: { label: "En cours", color: "bg-blue-100 text-blue-800" },
    completed: { label: "Terminée", color: "bg-green-100 text-green-800" },
    validated: { label: "Validée", color: "bg-green-100 text-green-800" },
    delivered: { label: "Livrée", color: "bg-purple-100 text-purple-800" },
  };

  const config = statusConfig[status] || {
    label: status,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
};

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// ErrorMessage Component
const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
    {message}
  </div>
);

export default DashboardView;
