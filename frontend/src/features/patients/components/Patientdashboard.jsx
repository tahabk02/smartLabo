// src/features/patients/components/PatientDashboard.jsx

import React, { useState } from "react";
import { Activity, Calendar, FileText, DollarSign, User } from "lucide-react";
import DashboardView from "./DashboardView";
import AppointmentsView from "./AppointmentsView";
import InvoicesView from "./InvoicesView";
import RequestView from "./RequestView";
import ProfileView from "./ProfileView";

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    {
      id: "dashboard",
      label: "Tableau de bord",
      icon: Activity,
      component: DashboardView,
    },
    {
      id: "request",
      label: "Demander RDV",
      icon: Calendar,
      component: RequestView,
    },
    {
      id: "appointments",
      label: "Mes Analyses",
      icon: FileText,
      component: AppointmentsView,
    },
    {
      id: "invoices",
      label: "Factures",
      icon: DollarSign,
      component: InvoicesView,
    },
    { id: "profile", label: "Profil", icon: User, component: ProfileView },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-blue-600">
            SmartLabo - Espace Patient
          </h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
};

export default PatientDashboard;
