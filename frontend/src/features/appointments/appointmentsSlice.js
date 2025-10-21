// src/features/appointments/appointmentsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// ============================================
// ASYNC THUNKS
// ============================================

// Fetch all appointments (Admin, Doctor, Nurse)
export const fetchAllAppointments = createAsyncThunk(
  "appointments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/appointments");
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

// Create new appointment (Patient)
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

// Confirm appointment (Admin, Doctor, Nurse)
export const confirmAppointment = createAsyncThunk(
  "appointments/confirm",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/confirm`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to confirm appointment"
      );
    }
  }
);

// Cancel appointment (Admin, Doctor, Nurse)
export const cancelAppointment = createAsyncThunk(
  "appointments/cancel",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel appointment"
      );
    }
  }
);

// Delete appointment (Admin only)
export const deleteAppointment = createAsyncThunk(
  "appointments/delete",
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/appointments/${appointmentId}`);
      return appointmentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete appointment"
      );
    }
  }
);

// ============================================
// SLICE
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
  },
  extraReducers: (builder) => {
    // Fetch All Appointments
    builder
      .addCase(fetchAllAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
        state.success = true;
      })
      .addCase(fetchAllAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Appointments by Patient
    builder
      .addCase(fetchAppointmentsByPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentsByPatient.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointmentsByPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Appointment by ID
    builder
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
      });

    // Create Appointment
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.push(action.payload);
        state.success = true;
        state.message = "Appointment created successfully";
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Confirm Appointment
    builder
      .addCase(confirmAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (apt) => apt._id === action.payload.populatedAppointment._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload.populatedAppointment;
        }
        state.currentAppointment = action.payload.populatedAppointment;
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(confirmAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel Appointment
    builder
      .addCase(cancelAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (apt) => apt._id === action.payload.appointment._id
        );
        if (index !== -1) {
          state.appointments[index] = action.payload.appointment;
        }
        state.success = true;
        state.message = action.payload.message;
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Delete Appointment
    builder
      .addCase(deleteAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = state.appointments.filter(
          (apt) => apt._id !== action.payload
        );
        state.success = true;
        state.message = "Appointment deleted successfully";
      })
      .addCase(deleteAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, resetCurrentAppointment } =
  appointmentsSlice.actions;

export default appointmentsSlice.reducer;
