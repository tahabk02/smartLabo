// src/features/patients/components/InvoicesView.jsx

import React, { useState, useEffect } from "react";
import { FileText, Calendar, DollarSign } from "lucide-react";
import patientApi from "../services/patientApi";

const InvoicesView = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await patientApi.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoiceDetails = async (invoiceId) => {
    try {
      const data = await patientApi.getInvoiceById(invoiceId);
      setSelectedInvoice(data);
    } catch (error) {
      alert("Erreur lors du chargement des détails de la facture");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Mes Factures</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total factures</p>
          <p className="text-xl font-bold">{invoices.length}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune facture pour le moment</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice._id}
              invoice={invoice}
              onView={() => viewInvoiceDetails(invoice._id)}
            />
          ))}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

// InvoiceCard Component
const InvoiceCard = ({ invoice, onView }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Payée":
        return "bg-green-100 text-green-800";
      case "En retard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">
              {invoice.numeroFacture}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(invoice.dateFacture).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800 mb-2">
            {invoice.montantTotal} MAD
          </p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              invoice.statut
            )}`}
          >
            {invoice.statut}
          </span>
        </div>
      </div>

      {invoice.items && invoice.items.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Articles:</p>
          <div className="space-y-1">
            {invoice.items.slice(0, 3).map((item, idx) => (
              <p key={idx} className="text-sm text-gray-600">
                • {item.description} - {item.total} MAD
              </p>
            ))}
            {invoice.items.length > 3 && (
              <p className="text-sm text-gray-500 italic">
                +{invoice.items.length - 3} autre(s) article(s)
              </p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onView}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Voir les détails
      </button>
    </div>
  );
};

// InvoiceDetailsModal Component
const InvoiceDetailsModal = ({ invoice, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">Détails de la facture</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Invoice Header */}
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-2xl font-bold text-gray-800">
              {invoice.numeroFacture}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Date:{" "}
              {new Date(invoice.dateFacture).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              invoice.statut === "Payée"
                ? "bg-green-100 text-green-800"
                : invoice.statut === "En retard"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {invoice.statut}
          </span>
        </div>

        {/* Patient Info */}
        {invoice.patient && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-semibold text-gray-700 mb-2">
              Informations patient
            </h5>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-medium">Nom:</span>{" "}
                {invoice.patient.firstName} {invoice.patient.lastName}
              </p>
              <p>
                <span className="font-medium">N° Patient:</span>{" "}
                {invoice.patient.numeroPatient}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {invoice.patient.email}
              </p>
              <p>
                <span className="font-medium">Téléphone:</span>{" "}
                {invoice.patient.phone}
              </p>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div>
          <h5 className="font-semibold text-gray-700 mb-3">
            Détail des prestations
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Prix unitaire
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3 text-sm">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.unitPrice} MAD
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {item.total} MAD
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-bold">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-blue-600">
                    {invoice.montantTotal} MAD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div>
            <h5 className="font-semibold text-gray-700 mb-2">Notes</h5>
            <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
        <div className="flex gap-2">
          {invoice.statut !== "Payée" && (
            <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              Payer maintenant
            </button>
          )}
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            Télécharger PDF
          </button>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
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

export default InvoicesView;
