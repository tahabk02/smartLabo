// src/features/analyses/analysesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = "http://localhost:5000/api/analyses";

// Helper function to get token
const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Fetch all analyses
export const fetchAnalyses = createAsyncThunk(
  "analyses/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, getAuthConfig());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analyses"
      );
    }
  }
);

// Create analysis
export const createAnalysis = createAsyncThunk(
  "analyses/create",
  async (analysisData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, analysisData, getAuthConfig());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create analysis"
      );
    }
  }
);

// Update analysis
export const updateAnalysis = createAsyncThunk(
  "analyses/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_URL}/${id}`,
        data,
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update analysis"
      );
    }
  }
);

// Delete analysis
export const deleteAnalysis = createAsyncThunk(
  "analyses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthConfig());
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete analysis"
      );
    }
  }
);

// Toggle analysis status
export const toggleAnalysisStatus = createAsyncThunk(
  "analyses/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${id}/toggle-status`,
        {},
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle analysis status"
      );
    }
  }
);

const analysesSlice = createSlice({
  name: "analyses",
  initialState: {
    analyses: [],
    loading: false,
    error: null,
    filters: {
      search: "",
      category: "all",
      status: "all",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch analyses
      .addCase(fetchAnalyses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyses.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses = action.payload;
      })
      .addCase(fetchAnalyses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create analysis
      .addCase(createAnalysis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.analyses.unshift(action.payload);
      })
      .addCase(createAnalysis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update analysis
      .addCase(updateAnalysis.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      })
      // Delete analysis
      .addCase(deleteAnalysis.fulfilled, (state, action) => {
        state.analyses = state.analyses.filter((a) => a._id !== action.payload);
      })
      // Toggle status
      .addCase(toggleAnalysisStatus.fulfilled, (state, action) => {
        const index = state.analyses.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.analyses[index] = action.payload;
        }
      });
  },
});

export const { setFilters, clearError } = analysesSlice.actions;
export default analysesSlice.reducer;
