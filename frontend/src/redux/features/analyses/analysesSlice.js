// src/redux/features/analyses/analysesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/apiClient";

// Async thunks pour la gestion des analyses
export const fetchAnalyses = createAsyncThunk(
  "analyses/fetchAnalyses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/analyses");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analyses"
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
  },
  reducers: {
    // reducers
  },
  extraReducers: (builder) => {
    // extraReducers
  },
});

export default analysesSlice.reducer;
