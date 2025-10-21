// src/features/patients/components/AppointmentsView.jsx

import React, { useState, useEffect } from "react";
import { Eye, FileText } from "lucide-react";
import patientApi from "../services/patientApi";
import styles from "./AppointmentsView.module.css";

const AppointmentsView = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await patientApi.getAppointments();
      setAnalyses(data);
    } catch (error) {
      console.error("Error loading analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewResults = async (analysisId) => {
    try {
      const results = await patientApi.getAnalysisResults(analysisId);
      setSelectedAnalysis(results);
    } catch (error) {
      alert("Les résultats ne sont pas encore disponibles");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Mes Analyses</h2>

      {analyses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune analyse pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {analyses.map((analysis) => (
            <AnalysisCard
              key={analysis._id}
              analysis={analysis}
              onViewResults={viewResults}
            />
          ))}
        </div>
      )}

      {/* Results Modal */}
      {selectedAnalysis && (
        <ResultsModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
};

// AnalysisCard Component
const AnalysisCard = ({ analysis, onViewResults }) => {
  const canViewResults = ["completed", "validated", "delivered"].includes(
    analysis.status
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">
            {analysis.analysisType?.name}
          </h3>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Code:</span>{" "}
              {analysis.analysisType?.code}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Catégorie:</span>{" "}
              {analysis.analysisType?.category}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Date:</span>{" "}
              {new Date(analysis.requestDate).toLocaleDateString("fr-FR")}
            </p>
            {analysis.invoice && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Facture:</span>{" "}
                {analysis.invoice.numeroFacture}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={analysis.status} />
          <p className="font-bold text-lg text-gray-800">
            {analysis.price} MAD
          </p>
        </div>
      </div>

      {canViewResults && (
        <button
          onClick={() => onViewResults(analysis._id)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          <Eye className="w-4 h-4" />
          Voir les résultats
        </button>
      )}
    </div>
  );
};

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

// ResultsModal Component
const ResultsModal = ({ analysis, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">
          Résultats - {analysis.analysisType?.name}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Analysis Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Date:</span>{" "}
            {new Date(analysis.resultDate).toLocaleDateString("fr-FR")}
          </p>
          {analysis.performedBy && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Réalisé par:</span>{" "}
              {analysis.performedBy.name}
            </p>
          )}
          {analysis.validatedBy && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Validé par:</span>{" "}
              {analysis.validatedBy.name}
            </p>
          )}
        </div>

        {/* Results */}
        {analysis.results && analysis.results.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Résultats</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Paramètre
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Valeur
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Unité
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Valeurs normales
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.results.map((result, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-2">{result.parameter}</td>
                      <td className="px-4 py-2 font-medium">{result.value}</td>
                      <td className="px-4 py-2">{result.unit}</td>
                      <td className="px-4 py-2">{result.normalRange || "-"}</td>
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

        {/* Interpretation */}
        {analysis.interpretation && (
          <div>
            <h4 className="font-semibold mb-2">Interprétation</h4>
            <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">
              {analysis.interpretation}
            </p>
          </div>
        )}

        {/* Conclusion */}
        {analysis.conclusion && (
          <div>
            <h4 className="font-semibold mb-2">Conclusion</h4>
            <p className="text-gray-700 bg-green-50 p-4 rounded-lg">
              {analysis.conclusion}
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
);

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export default AppointmentsView;
