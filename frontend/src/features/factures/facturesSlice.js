import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// --- Async Thunks ---
export const fetchFactures = createAsyncThunk(
  "factures/fetchFactures",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.user?.token || localStorage.getItem("token");

      if (!token) throw new Error("Utilisateur non authentifié");

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const response = await axios.get(`${API_URL}/factures`, config);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

export const createFacture = createAsyncThunk(
  "factures/createFacture",
  async (factureData, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.user?.token || localStorage.getItem("token");
      if (!token) throw new Error("Utilisateur non authentifié");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(
        `${API_URL}/factures`,
        factureData,
        config
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

export const updateFacture = createAsyncThunk(
  "factures/updateFacture",
  async ({ id, data }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.user?.token || localStorage.getItem("token");
      if (!token) throw new Error("Utilisateur non authentifié");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.put(
        `${API_URL}/factures/${id}`,
        data,
        config
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

export const deleteFacture = createAsyncThunk(
  "factures/deleteFacture",
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.user?.token || localStorage.getItem("token");
      if (!token) throw new Error("Utilisateur non authentifié");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/factures/${id}`, config);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// --- Slice ---
const facturesSlice = createSlice({
  name: "factures",
  initialState: {
    factures: [],
    loading: false,
    error: null,
    filters: { search: "", paymentStatus: "all" },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchFactures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFactures.fulfilled, (state, action) => {
        state.loading = false;
        state.factures = action.payload;
      })
      .addCase(fetchFactures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createFacture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFacture.fulfilled, (state, action) => {
        state.loading = false;
        state.factures.push(action.payload);
      })
      .addCase(createFacture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update
      .addCase(updateFacture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFacture.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.factures.findIndex(
          (f) => f._id === action.payload._id
        );
        if (index !== -1) state.factures[index] = action.payload;
      })
      .addCase(updateFacture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete
      .addCase(deleteFacture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFacture.fulfilled, (state, action) => {
        state.loading = false;
        state.factures = state.factures.filter((f) => f._id !== action.payload);
      })
      .addCase(deleteFacture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters } = facturesSlice.actions;
export default facturesSlice.reducer;
