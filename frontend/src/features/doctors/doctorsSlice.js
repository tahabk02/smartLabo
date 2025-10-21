import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/doctors";

/* ------------------------------------------------------------
   🔒 Helper: Get Auth Config with Token
------------------------------------------------------------- */
const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ No authentication token found");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

/* ------------------------------------------------------------
   🔧 Helper: Handle API Errors
------------------------------------------------------------- */
const handleApiError = (error) => {
  console.error("API Error Details:", error);

  if (error.response) {
    const message = error.response.data?.message || error.response.data?.error;
    const status = error.response.status;

    console.error(`Response Status: ${status}`, error.response.data);

    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return "Session expired. Please login again.";
    }

    if (status === 403) {
      return "You don't have permission to perform this action.";
    }

    return message || `Server error: ${status}`;
  } else if (error.request) {
    console.error("No response from server:", error.request);
    return "Cannot connect to server. Please check if backend is running.";
  } else {
    console.error("Error setting up request:", error.message);
    return error.message || "An unexpected error occurred";
  }
};

/* ------------------------------------------------------------
   🩺 Thunks (Async Actions)
------------------------------------------------------------- */

// ✅ Fetch all doctors
export const fetchDoctors = createAsyncThunk(
  "doctors/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      console.log("📡 Fetching doctors from:", API_URL);
      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);

      const { data } = await axios.get(API_URL, getAuthConfig());
      console.log("✅ Doctors fetched successfully:", data.length, "doctors");
      return data;
    } catch (error) {
      console.error("❌ Fetch doctors error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ✅ Fetch single doctor by ID
export const fetchDoctorById = createAsyncThunk(
  "doctors/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Doctor ID is required");
      }

      console.log("📡 Fetching doctor:", id);
      const { data } = await axios.get(`${API_URL}/${id}`, getAuthConfig());
      console.log("✅ Doctor fetched:", data);
      return data;
    } catch (error) {
      console.error("❌ Fetch doctor by ID error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ✅ Create new doctor (with FormData for photo upload)
export const createDoctor = createAsyncThunk(
  "doctors/create",
  async (doctorData, { rejectWithValue }) => {
    try {
      console.log("📡 Creating doctor:", doctorData);

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(API_URL, doctorData, config);
      console.log("✅ Doctor created:", data);
      return data;
    } catch (error) {
      console.error("❌ Create doctor error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ✅ Update existing doctor (with FormData for photo upload)
export const updateDoctor = createAsyncThunk(
  "doctors/update",
  async ({ id, data: doctorData }, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Doctor ID is required");
      }

      console.log("📡 Updating doctor:", id, doctorData);

      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.put(`${API_URL}/${id}`, doctorData, config);
      console.log("✅ Doctor updated:", data);
      return data;
    } catch (error) {
      console.error("❌ Update doctor error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ✅ Delete doctor
export const deleteDoctor = createAsyncThunk(
  "doctors/delete",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Doctor ID is required");
      }

      console.log("📡 Deleting doctor:", id);
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());
      console.log("✅ Doctor deleted:", id);
      return id;
    } catch (error) {
      console.error("❌ Delete doctor error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

// ✅ Toggle active/inactive doctor status
export const toggleDoctorStatus = createAsyncThunk(
  "doctors/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        throw new Error("Doctor ID is required");
      }

      console.log("📡 Toggling status for doctor:", id);
      const { data } = await axios.patch(
        `${API_URL}/${id}/toggle-status`,
        {},
        getAuthConfig()
      );
      console.log("✅ Status toggled:", data);
      return data;
    } catch (error) {
      console.error("❌ Toggle status error:", error);
      return rejectWithValue(handleApiError(error));
    }
  }
);

/* ------------------------------------------------------------
   🧩 Slice Definition
------------------------------------------------------------- */
const doctorsSlice = createSlice({
  name: "doctors",
  initialState: {
    doctors: [],
    currentDoctor: null,
    loading: false,
    error: null,
    success: null,
    filters: {
      search: "",
      specialty: "all",
      status: "all",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      console.log("🔍 Setting filters:", action.payload);
      state.filters = { ...state.filters, ...action.payload };
    },

    clearError: (state) => {
      state.error = null;
    },

    clearSuccess: (state) => {
      state.success = null;
    },

    clearCurrentDoctor: (state) => {
      state.currentDoctor = null;
    },

    resetDoctorsState: (state) => {
      state.doctors = [];
      state.currentDoctor = null;
      state.loading = false;
      state.error = null;
      state.success = null;
      state.filters = {
        search: "",
        specialty: "all",
        status: "all",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Doctors
      .addCase(fetchDoctors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
        console.log("✅ Doctors loaded into state:", state.doctors.length);
      })
      .addCase(fetchDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch doctors";
        state.doctors = [];
      })

      // Fetch Single Doctor
      .addCase(fetchDoctorById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentDoctor = null;
      })
      .addCase(fetchDoctorById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDoctor = action.payload;
        state.error = null;
      })
      .addCase(fetchDoctorById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch doctor details";
        state.currentDoctor = null;
      })

      // Create Doctor
      .addCase(createDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors.unshift(action.payload);
        state.success = "Doctor created successfully!";
        state.error = null;
      })
      .addCase(createDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create doctor";
        state.success = null;
      })

      // Update Doctor
      .addCase(updateDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.loading = false;

        const index = state.doctors.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }

        if (state.currentDoctor?._id === action.payload._id) {
          state.currentDoctor = action.payload;
        }

        state.success = "Doctor updated successfully!";
        state.error = null;
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to update doctor";
        state.success = null;
      })

      // Delete Doctor
      .addCase(deleteDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = state.doctors.filter((d) => d._id !== action.payload);

        if (state.currentDoctor?._id === action.payload) {
          state.currentDoctor = null;
        }

        state.success = "Doctor deleted successfully!";
        state.error = null;
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete doctor";
        state.success = null;
      })

      // Toggle Status
      .addCase(toggleDoctorStatus.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(toggleDoctorStatus.fulfilled, (state, action) => {
        const index = state.doctors.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }

        if (state.currentDoctor?._id === action.payload._id) {
          state.currentDoctor = action.payload;
        }

        state.success = "Doctor status updated successfully!";
        state.error = null;
      })
      .addCase(toggleDoctorStatus.rejected, (state, action) => {
        state.error = action.payload || "Failed to toggle doctor status";
        state.success = null;
      });
  },
});

/* ------------------------------------------------------------
   🎯 Selectors
------------------------------------------------------------- */
export const selectAllDoctors = (state) => state.doctors.doctors;
export const selectCurrentDoctor = (state) => state.doctors.currentDoctor;
export const selectDoctorsLoading = (state) => state.doctors.loading;
export const selectDoctorsError = (state) => state.doctors.error;
export const selectDoctorsSuccess = (state) => state.doctors.success;
export const selectDoctorsFilters = (state) => state.doctors.filters;

export const selectFilteredDoctors = (state) => {
  const { doctors, filters } = state.doctors;

  console.log("🔍 Filtering doctors:", {
    totalDoctors: doctors.length,
    filters: filters,
  });

  const filtered = doctors.filter((doctor) => {
    const matchesSearch =
      !filters.search ||
      doctor.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesSpecialty =
      filters.specialty === "all" || doctor.specialty === filters.specialty;

    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && doctor.isActive) ||
      (filters.status === "inactive" && !doctor.isActive);

    const result = matchesSearch && matchesSpecialty && matchesStatus;

    if (!result) {
      console.log("❌ Filtered out doctor:", doctor.name, {
        matchesSearch,
        matchesSpecialty,
        matchesStatus,
        doctorSpecialty: doctor.specialty,
        filterSpecialty: filters.specialty,
      });
    }

    return result;
  });

  console.log("✅ Filtered result:", filtered.length, "doctors");
  return filtered;
};

/* ------------------------------------------------------------
   🚀 Exports
------------------------------------------------------------- */
export const {
  setFilters,
  clearError,
  clearSuccess,
  clearCurrentDoctor,
  resetDoctorsState,
} = doctorsSlice.actions;

export default doctorsSlice.reducer;
