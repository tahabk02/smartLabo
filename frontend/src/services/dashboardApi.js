// src/services/dashboardApi.js
import api from "./apiClient"; // ton axios instance avec token et baseURL

const dashboardApi = {
  // Récupérer les statistiques générales
  fetchStats: async () => {
    try {
      const response = await api.get("/dashboard/stats");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des stats"
      );
    }
  },

  // Récupérer les activités récentes
  getRecentActivities: async () => {
    try {
      const response = await api.get("/dashboard/recent-activities");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Erreur lors de la récupération des activités"
      );
    }
  },
};

export default dashboardApi;
