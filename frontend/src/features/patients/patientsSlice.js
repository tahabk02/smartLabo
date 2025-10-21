import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// Fetch all patients
export const fetchPatients = createAsyncThunk(
  "patients/fetchPatients",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/patients");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch patients"
      );
    }
  }
);

// 🆕 Fetch single patient by ID
export const fetchPatientById = createAsyncThunk(
  "patients/fetchPatientById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch patient"
      );
    }
  }
);

// Create patient
export const createPatient = createAsyncThunk(
  "patients/createPatient",
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await api.post("/patients", patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create patient"
      );
    }
  }
);

// Update patient
export const updatePatient = createAsyncThunk(
  "patients/updatePatient",
  async ({ id, patientData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update patient"
      );
    }
  }
);

// Delete patient
export const deletePatient = createAsyncThunk(
  "patients/deletePatient",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/patients/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete patient"
      );
    }
  }
);

const patientsSlice = createSlice({
  name: "patients",
  initialState: {
    patients: [],
    currentPatient: null, // 🆕 Pour stocker le patient actuel
    loading: false,
    error: null,
    filters: {
      search: "",
      gender: "all",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all patients
      .addCase(fetchPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.patients = action.payload;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 🆕 Fetch single patient
      .addCase(fetchPatientById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPatient = action.payload;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create patient
      .addCase(createPatient.fulfilled, (state, action) => {
        state.patients.push(action.payload);
      })
      // Update patient
      .addCase(updatePatient.fulfilled, (state, action) => {
        const index = state.patients.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        // Update current patient if it's the same
        if (state.currentPatient?._id === action.payload._id) {
          state.currentPatient = action.payload;
        }
      })
      // Delete patient
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.patients = state.patients.filter((p) => p._id !== action.payload);
        if (state.currentPatient?._id === action.payload) {
          state.currentPatient = null;
        }
      });
  },
});

export const { setFilters, clearError, clearCurrentPatient } =
  patientsSlice.actions;
export default patientsSlice.reducer;
