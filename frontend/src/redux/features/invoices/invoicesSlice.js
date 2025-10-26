// src/redux/features/invoices/invoicesSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../../services/apiClient";

// Async thunks pour la gestion des factures
export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/invoices");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch invoices"
      );
    }
  }
);

const invoicesSlice = createSlice({
  name: "invoices",
  initialState: {
    invoices: [],
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

export default invoicesSlice.reducer;
