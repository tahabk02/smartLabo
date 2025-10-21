// src/features/patients/components/RequestView.jsx

import React, { useState, useEffect } from "react";
import { Search, User, Phone, X, Check } from "lucide-react";
import patientApi from "../services/patientApi";

const RequestView = () => {
  const [catalog, setCatalog] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catalogData, doctorsData] = await Promise.all([
        patientApi.getAnalysesCatalog(),
        patientApi.getDoctors(),
      ]);
      setCatalog(catalogData);
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnalysis = (analysisId) => {
    setSelectedAnalyses((prev) =>
      prev.includes(analysisId)
        ? prev.filter((id) => id !== analysisId)
        : [...prev, analysisId]
    );
  };

  const handleSubmit = async (notes) => {
    try {
      await patientApi.createAppointment({
        analysisIds: selectedAnalyses,
        preferredDate: new Date().toISOString(),
        notes,
      });
      alert(
        "✅ Rendez-vous créé avec succès ! La facture a été générée automatiquement."
      );
      setSelectedAnalyses([]);
      setShowModal(false);
    } catch (error) {
      alert("❌ Erreur lors de la création du rendez-vous");
    }
  };

  const filteredCatalog = catalog.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = catalog
    .filter((a) => selectedAnalyses.includes(a._id))
    .reduce((sum, a) => sum + a.price, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Demander un rendez-vous
      </h2>

      {/* Analysis Catalog */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une analyse par nom ou code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Catalogue d'analyses</h3>
        <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
          {filteredCatalog.length > 0 ? (
            filteredCatalog.map((analysis) => {
              const isSelected = selectedAnalyses.includes(analysis._id);
              return (
                <div
                  key={analysis._id}
                  onClick={() => toggleAnalysis(analysis._id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-800">
                          {analysis.name}
                        </h4>
                        {isSelected && (
                          <Check className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {analysis.code} • {analysis.category}
                      </p>
                      {analysis.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {analysis.description}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-lg text-gray-800 ml-4">
                      {analysis.price} MAD
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucune analyse trouvée
            </p>
          )}
        </div>

        {/* Selected Summary */}
        {selectedAnalyses.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <p className="font-semibold text-gray-800">
                {selectedAnalyses.length} analyse
                {selectedAnalyses.length > 1 ? "s" : ""} sélectionnée
                {selectedAnalyses.length > 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setSelectedAnalyses([])}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Tout désélectionner
              </button>
            </div>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              Total: {totalAmount} MAD
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition"
            >
              Confirmer la demande
            </button>
          </div>
        )}
      </div>

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Médecins disponibles</h3>
        {doctors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Aucun médecin disponible
          </p>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <ConfirmationModal
          totalAmount={totalAmount}
          analysisCount={selectedAnalyses.length}
          onConfirm={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

// DoctorCard Component
const DoctorCard = ({ doctor }) => (
  <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
        {doctor.photo ? (
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-8 h-8 text-blue-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{doctor.name}</p>
        <p className="text-sm text-gray-600">{doctor.specialization}</p>
        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
          <Phone className="w-4 h-4" />
          <span>{doctor.phone}</span>
        </div>
      </div>
    </div>
  </div>
);

// ConfirmationModal Component
const ConfirmationModal = ({
  totalAmount,
  analysisCount,
  onConfirm,
  onCancel,
}) => {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              Confirmer la demande
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Nombre d'analyses</p>
            <p className="text-lg font-semibold">{analysisCount}</p>
            <p className="text-sm text-gray-600 mt-2 mb-1">Montant total</p>
            <p className="text-2xl font-bold text-blue-600">
              {totalAmount} MAD
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              placeholder="Ajoutez des notes pour votre rendez-vous..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              ℹ️ Une facture sera générée automatiquement après confirmation
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(notes)}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export default RequestView;
