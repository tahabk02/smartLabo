// src/features/patients/services/patientApi.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function for API calls
const apiCall = async (endpoint, method = "GET", body = null) => {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "API Error");
  }

  return response.json();
};

// Patient API Services
export const patientApi = {
  // Dashboard Stats
  getDashboardStats: () => apiCall("/patient/dashboard/stats"),

  // Analyses Catalog
  getAnalysesCatalog: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/patient/analyses/catalog${query ? "?" + query : ""}`);
  },

  // Doctors
  getDoctors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/patient/doctors${query ? "?" + query : ""}`);
  },

  getDoctorById: (id) => apiCall(`/patient/doctors/${id}`),

  // Appointments
  getAppointments: () => apiCall("/patient/appointments"),

  createAppointment: (data) =>
    apiCall("/patient/appointments/request", "POST", data),

  // Analysis Results
  getAnalysisResults: (id) => apiCall(`/patient/analyses/${id}/results`),

  // Invoices
  getInvoices: () => apiCall("/patient/invoices"),

  getInvoiceById: (id) => apiCall(`/patient/invoices/${id}`),

  // Profile
  getProfile: () => apiCall("/patient/profile"),

  updateProfile: (data) => apiCall("/patient/profile", "PUT", data),
};

export default patientApi;
