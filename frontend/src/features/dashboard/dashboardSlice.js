import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// ===== ASYNC THUNKS =====

// Récupérer les statistiques du dashboard
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/stats");
      const data = response.data;
      return {
        totalPatients: data.patients?.total || 0,
        totalAnalyses: data.tasks?.total || 0,
        totalFactures: data.factures?.unpaid || 0,
        revenuMensuel: data.revenue?.total || 0,
        facturesEnAttente: data.factures?.unpaid || 0,
        analysesEnCours: data.tasks?.inProgress || 0,
        tachesAujourdhui: data.tasks?.today || 0,
        tauxOccupation: 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Erreur lors du chargement des statistiques"
      );
    }
  }
);

// Récupérer les activités récentes
export const fetchRecentActivities = createAsyncThunk(
  "dashboard/fetchActivities",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get(`/dashboard/activities?limit=${limit}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Erreur lors du chargement des activités"
      );
    }
  }
);

// Récupérer les graphiques/analytics
export const fetchAnalytics = createAsyncThunk(
  "dashboard/fetchAnalytics",
  async (period = "month", { rejectWithValue }) => {
    try {
      const endpoint =
        period === "week" ? "/dashboard/weekly" : "/dashboard/monthly";
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Erreur lors du chargement des analytics"
      );
    }
  }
);

// Récupérer les patients récents
export const fetchRecentPatients = createAsyncThunk(
  "dashboard/fetchRecentPatients",
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await api.get("/patients");
      const patients = Array.isArray(response.data) ? response.data : [];

      // Trier par date de création (plus récent en premier) et limiter
      return patients
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Erreur lors du chargement des patients récents"
      );
    }
  }
);

// Récupérer les factures en attente
export const fetchPendingInvoices = createAsyncThunk(
  "dashboard/fetchPendingInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/factures");
      const factures = Array.isArray(response.data) ? response.data : [];

      // Filtrer les factures en attente (non payées)
      return factures
        .filter(
          (f) =>
            f.statut === "en_attente" || f.statut === "pending" || !f.statut
        )
        .slice(0, 10);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Erreur lors du chargement des factures"
      );
    }
  }
);

// Récupérer les tâches du jour
export const fetchTodayTasks = createAsyncThunk(
  "dashboard/fetchTodayTasks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/tasks");
      const tasks = Array.isArray(response.data) ? response.data : [];

      // Filtrer les tâches d'aujourd'hui
      const today = new Date().toISOString().split("T")[0];
      return tasks
        .filter((task) => {
          const taskDate = new Date(task.date || task.createdAt)
            .toISOString()
            .split("T")[0];
          return taskDate === today;
        })
        .slice(0, 10);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Erreur lors du chargement des tâches"
      );
    }
  }
);

// Rafraîchir toutes les données du dashboard
export const refreshDashboard = createAsyncThunk(
  "dashboard/refreshAll",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await Promise.all([
        dispatch(fetchDashboardStats()),
        dispatch(fetchRecentActivities()),
        dispatch(fetchAnalytics()),
        dispatch(fetchRecentPatients()),
        dispatch(fetchPendingInvoices()),
        dispatch(fetchTodayTasks()),
      ]);
      return { success: true };
    } catch (error) {
      return rejectWithValue("Erreur lors du rafraîchissement du dashboard");
    }
  }
);

// ===== INITIAL STATE =====
const initialState = {
  stats: {
    totalPatients: 0,
    totalAnalyses: 0,
    totalFactures: 0,
    revenuMensuel: 0,
    facturesEnAttente: 0,
    analysesEnCours: 0,
    tachesAujourdhui: 0,
    tauxOccupation: 0,
  },
  activities: [],
  analytics: {
    revenueChart: [],
    patientsChart: [],
    analysesChart: [],
    topAnalyses: [],
  },
  recentPatients: [],
  pendingInvoices: [],
  todayTasks: [],
  loading: {
    stats: false,
    activities: false,
    analytics: false,
    patients: false,
    invoices: false,
    tasks: false,
    refresh: false,
  },
  error: null,
  lastUpdate: null,
  selectedPeriod: "month",
};

// ===== SLICE =====
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAnalyticsPeriod: (state, action) => {
      state.selectedPeriod = action.payload;
    },
    markActivityAsRead: (state, action) => {
      const activity = state.activities.find((a) => a._id === action.payload);
      if (activity) {
        activity.read = true;
      }
    },
    markAllActivitiesAsRead: (state) => {
      state.activities.forEach((activity) => {
        activity.read = true;
      });
    },
    removeActivity: (state, action) => {
      state.activities = state.activities.filter(
        (a) => a._id !== action.payload
      );
    },
    resetDashboard: () => {
      return initialState;
    },
    updateStat: (state, action) => {
      const { key, value } = action.payload;
      if (state.stats.hasOwnProperty(key)) {
        state.stats[key] = value;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ===== FETCH STATS =====
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = { ...state.stats, ...action.payload };
        state.lastUpdate = new Date().toISOString();
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      })

      // ===== FETCH ACTIVITIES =====
      .addCase(fetchRecentActivities.pending, (state) => {
        state.loading.activities = true;
        state.error = null;
      })
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.loading.activities = false;
        state.activities = action.payload;
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        state.loading.activities = false;
        state.error = action.payload;
      })

      // ===== FETCH ANALYTICS =====
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = { ...state.analytics, ...action.payload };
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = action.payload;
      })

      // ===== FETCH RECENT PATIENTS =====
      .addCase(fetchRecentPatients.pending, (state) => {
        state.loading.patients = true;
        state.error = null;
      })
      .addCase(fetchRecentPatients.fulfilled, (state, action) => {
        state.loading.patients = false;
        state.recentPatients = action.payload;
      })
      .addCase(fetchRecentPatients.rejected, (state, action) => {
        state.loading.patients = false;
        state.error = action.payload;
      })

      // ===== FETCH PENDING INVOICES =====
      .addCase(fetchPendingInvoices.pending, (state) => {
        state.loading.invoices = true;
        state.error = null;
      })
      .addCase(fetchPendingInvoices.fulfilled, (state, action) => {
        state.loading.invoices = false;
        state.pendingInvoices = action.payload;
      })
      .addCase(fetchPendingInvoices.rejected, (state, action) => {
        state.loading.invoices = false;
        state.error = action.payload;
      })

      // ===== FETCH TODAY TASKS =====
      .addCase(fetchTodayTasks.pending, (state) => {
        state.loading.tasks = true;
        state.error = null;
      })
      .addCase(fetchTodayTasks.fulfilled, (state, action) => {
        state.loading.tasks = false;
        state.todayTasks = action.payload;
      })
      .addCase(fetchTodayTasks.rejected, (state, action) => {
        state.loading.tasks = false;
        state.error = action.payload;
      })

      // ===== REFRESH ALL =====
      .addCase(refreshDashboard.pending, (state) => {
        state.loading.refresh = true;
        Object.keys(state.loading).forEach((key) => {
          if (key !== "refresh") {
            state.loading[key] = true;
          }
        });
      })
      .addCase(refreshDashboard.fulfilled, (state) => {
        state.loading.refresh = false;
        Object.keys(state.loading).forEach((key) => {
          state.loading[key] = false;
        });
        state.lastUpdate = new Date().toISOString();
        state.error = null;
      })
      .addCase(refreshDashboard.rejected, (state, action) => {
        state.loading.refresh = false;
        Object.keys(state.loading).forEach((key) => {
          state.loading[key] = false;
        });
        state.error = action.payload;
      });
  },
});

// ===== EXPORTS =====
export const {
  clearError,
  setAnalyticsPeriod,
  markActivityAsRead,
  markAllActivitiesAsRead,
  removeActivity,
  resetDashboard,
  updateStat,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

// ===== SELECTORS =====
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectRecentActivities = (state) => state.dashboard.activities;
export const selectUnreadActivities = (state) =>
  state.dashboard.activities.filter((activity) => !activity.read);
export const selectAnalytics = (state) => state.dashboard.analytics;
export const selectRecentPatients = (state) => state.dashboard.recentPatients;
export const selectPendingInvoices = (state) => state.dashboard.pendingInvoices;
export const selectTodayTasks = (state) => state.dashboard.todayTasks;
export const selectIsLoading = (state) =>
  Object.values(state.dashboard.loading).some((loading) => loading);
export const selectSpecificLoading = (key) => (state) =>
  state.dashboard.loading[key];
export const selectDashboardError = (state) => state.dashboard.error;
export const selectLastUpdate = (state) => state.dashboard.lastUpdate;
export const selectSelectedPeriod = (state) => state.dashboard.selectedPeriod;
