import axios from "axios";

const API_URL = "http://localhost:5000/api/analyse-types";

// Créer une instance axios avec configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const analyseTypeService = {
  // Récupérer tous les types d'analyses
  getAllAnalyseTypes: async () => {
    try {
      const response = await api.get("/");
      return response.data;
    } catch (error) {
      console.error("Error fetching analyse types:", error);
      throw error;
    }
  },

  // Récupérer un type d'analyse par ID
  getAnalyseTypeById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching analyse type:", error);
      throw error;
    }
  },

  // Créer un nouveau type d'analyse
  createAnalyseType: async (analyseTypeData) => {
    try {
      const response = await api.post("/", analyseTypeData);
      return response.data;
    } catch (error) {
      console.error("Error creating analyse type:", error);
      throw error;
    }
  },

  // Mettre à jour un type d'analyse
  updateAnalyseType: async (id, analyseTypeData) => {
    try {
      const response = await api.put(`/${id}`, analyseTypeData);
      return response.data;
    } catch (error) {
      console.error("Error updating analyse type:", error);
      throw error;
    }
  },

  // Supprimer un type d'analyse
  deleteAnalyseType: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting analyse type:", error);
      throw error;
    }
  },

  // Rechercher des types d'analyses
  searchAnalyseTypes: async (searchTerm) => {
    try {
      const response = await api.get(
        `/search?q=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching analyse types:", error);
      throw error;
    }
  },
};

export default analyseTypeService;
