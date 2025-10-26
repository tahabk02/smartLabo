// frontend/src/features/appointments/appointmentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// ============================================
// ASYNC THUNKS - Actions asynchrones unifiées
// ============================================

// Fetch all appointments with optional filters
export const fetchAllAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all") {
        params.append("status", filters.status);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.dateRange?.start) {
        params.append("startDate", filters.dateRange.start);
      }
      if (filters.dateRange?.end) {
        params.append("endDate", filters.dateRange.end);
      }

      const response = await api.get(`/appointments?${params.toString()}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch appointments"
      );
    }
  }
);

// Fetch appointments by patient
export const fetchAppointmentsByPatient = createAsyncThunk(
  "appointments/fetchByPatient",
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/appointments/patient/${patientId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch patient appointments"
      );
    }
  }
);

// Fetch single appointment by ID
export const fetchAppointmentById = createAsyncThunk(
  "appointments/fetchById",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch appointment"
      );
    }
  }
);

// Create new appointment
export const createAppointment = createAsyncThunk(
  "appointments/create",
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/appointments", appointmentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create appointment"
      );
    }
  }
);

// Update appointment
export const updateAppointment = createAsyncThunk(
  "appointments/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update appointment"
      );
    }
  }
);

// Confirm appointment
export const confirmAppointment = createAsyncThunk(
  "appointments/confirm",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentId}/confirm`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to confirm appointment"
      );
    }
  }
);

// Cancel appointment
export const cancelAppointment = createAsyncThunk(
  "appointments/cancel",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    }
  }
);

// Complete appointment
export const completeAppointment = createAsyncThunk(
  "appointments/complete",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/appointments/${appointmentId}/complete`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to complete appointment"
      );
    }
  }
);

// Delete appointment
export const deleteAppointment = createAsyncThunk(
  "appointments/delete",
  async (appointmentId, { rejectWithValue }) => {
    try {
      await api.delete(`/appointments/${appointmentId}`);
      return appointmentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete appointment"
      );
    }
  }
);

// ============================================
// SLICE - État unifié
// ============================================

const appointmentsSlice = createSlice({
  name: "appointments",
  initialState: {
    appointments: [],
    currentAppointment: null,
    loading: false,
    error: null,
    success: false,
    message: "",
    filters: {
      search: "",
      status: "all",
      dateRange: {
        start: null,
        end: null,
      },
    },
    stats: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    },
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
      state.message = "";
    },
    resetCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        search: "",
        status: "all",
        dateRange: { start: null, end: null },
      };
    },
    calculateStats: (state) => {
      state.stats.total = state.appointments.length;
      state.stats.pending = state.appointments.filter(
        (a) => a.status === "pending"
      ).length;
      state.stats.confirmed = state.appointments.filter(
        (a) => a.status === "confirmed"
      ).length;
      state.stats.completed = state.appointments.filter(
        (a) => a.status === "completed"
      ).length;
      state.stats.cancelled = state.appointments.filter(
        (a) => a.status === "cancelled"
      ).length;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Appointments
      .addCase(fetchAllAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.success = true;
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(fetchAllAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Appointments by Patient
      .addCase(fetchAppointmentsByPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(fetchAppointmentsByPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Appointment by ID
      .addCase(fetchAppointmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.unshift(action.payload);
        state.success = true;
        state.message = "Appointment created successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Appointment
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?._id === action.payload._id) {
          state.currentAppointment = action.payload;
        }
        state.success = true;
        state.message = "Appointment updated successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Status updates (Confirm, Cancel, Complete)
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (apt) => apt._id === action.payload._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?._id === action.payload._id) {
          state.currentAppointment = action.payload;
        }
        state.success = true;
        state.message = "Appointment confirmed successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (apt) => apt._id === action.payload._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?._id === action.payload._id) {
          state.currentAppointment = action.payload;
        }
        state.success = true;
        state.message = "Appointment cancelled successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(completeAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (apt) => apt._id === action.payload._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload;
        }
        if (state.currentAppointment?._id === action.payload._id) {
          state.currentAppointment = action.payload;
        }
        state.success = true;
        state.message = "Appointment completed successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })

      // Delete Appointment
      .addCase(deleteAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = state.appointments.filter(
          (apt) => apt._id !== action.payload
        );
        if (state.currentAppointment?._id === action.payload) {
          state.currentAppointment = null;
        }
        state.success = true;
        state.message = "Appointment deleted successfully";
        appointmentsSlice.caseReducers.calculateStats(state);
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearSuccess,
  resetCurrentAppointment,
  setFilters,
  resetFilters,
  calculateStats,
} = appointmentsSlice.actions;

export default appointmentsSlice.reducer;

// ============================================
// SELECTORS
// ============================================

export const selectAllAppointments = (state) => state.appointments.appointments;
export const selectAppointmentsLoading = (state) => state.appointments.loading;
export const selectAppointmentsError = (state) => state.appointments.error;
export const selectAppointmentsSuccess = (state) => state.appointments.success;
export const selectAppointmentsMessage = (state) => state.appointments.message;
export const selectCurrentAppointment = (state) =>
  state.appointments.currentAppointment;
export const selectAppointmentsStats = (state) => state.appointments.stats;
export const selectAppointmentsFilters = (state) => state.appointments.filters;

// Selector avec filtres appliqués
export const selectFilteredAppointments = (state) => {
  const { appointments, filters } = state.appointments;

  return appointments.filter((appointment) => {
    const matchesSearch = filters.search
      ? appointment.patient?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        appointment.patient?.email
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        appointment._id.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    const matchesStatus =
      filters.status === "all" || appointment.status === filters.status;

    const matchesDateRange =
      (!filters.dateRange.start ||
        new Date(appointment.date) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end ||
        new Date(appointment.date) <= new Date(filters.dateRange.end));

    return matchesSearch && matchesStatus && matchesDateRange;
  });
};
