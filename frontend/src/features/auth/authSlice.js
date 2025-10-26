import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// ==================== ASYNC THUNKS ====================

// Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      console.log("🔐 Attempting login with:", credentials.email);
      const response = await api.post("/auth/login", credentials);

      console.log("✅ Login response:", response.data);

      // Vérifier que le token existe
      if (!response.data.token) {
        console.error("❌ No token in response:", response.data);
        return rejectWithValue("Token manquant dans la réponse");
      }

      // 🔥 CORRECTION : Sauvegarder TOUT dans localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user)); // 🔥 AJOUT IMPORTANT

      console.log(
        "💾 Token saved to localStorage:",
        localStorage.getItem("token")
      );
      console.log(
        "💾 User saved to localStorage:",
        localStorage.getItem("user")
      );

      return response.data;
    } catch (error) {
      console.error("❌ Login error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

// Register
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      console.log("📝 Attempting registration:", userData.email);
      const response = await api.post("/auth/register", userData);

      console.log("✅ Registration response:", response.data);

      if (!response.data.token) {
        console.error("❌ No token in response:", response.data);
        return rejectWithValue("Token manquant dans la réponse");
      }

      // 🔥 CORRECTION : Sauvegarder TOUT dans localStorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user)); // 🔥 AJOUT IMPORTANT

      console.log(
        "💾 Token saved to localStorage:",
        localStorage.getItem("token")
      );
      console.log(
        "💾 User saved to localStorage:",
        localStorage.getItem("user")
      );

      return response.data;
    } catch (error) {
      console.error(
        "❌ Registration error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Load User
export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      console.log("🔍 Loading user with token:", token ? "exists" : "null");

      if (!token) return rejectWithValue("No token found");

      const response = await api.get("/auth/me");
      console.log("✅ User loaded:", response.data);

      // 🔥 CORRECTION : Mettre à jour localStorage avec les données fraîches
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data.user;
    } catch (error) {
      console.error(
        "❌ Load user error:",
        error.response?.data || error.message
      );
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // 🔥 CORRECTION : Nettoyer user aussi
      return rejectWithValue(
        error.response?.data?.message || "Failed to load user"
      );
    }
  }
);

// Update User
export const updateUser = createAsyncThunk(
  "auth/updateUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put("/auth/me", userData);
      console.log("✅ User updated:", response.data);

      // 🔥 CORRECTION : Mettre à jour localStorage
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data.user;
    } catch (error) {
      console.error("❌ Update error:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Update failed");
    }
  }
);

// ==================== SLICE ====================

const authSlice = createSlice({
  name: "auth",
  initialState: {
    // 🔥 CORRECTION : Charger user depuis localStorage
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      console.log("🚪 Logging out...");
      // 🔥 CORRECTION : Nettoyer COMPLÈTEMENT localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // 🔥 NOUVEAU : Initialiser l'authentification depuis localStorage
    initializeAuth: (state) => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      console.log("🔍 Initializing auth from localStorage...");
      console.log("Token:", token ? "exists" : "null");
      console.log("User:", user ? "exists" : "null");

      if (token && user) {
        try {
          state.token = token;
          state.user = JSON.parse(user);
          state.isAuthenticated = true;
          console.log("✅ Auth initialized successfully from localStorage");
        } catch (error) {
          console.error("❌ Error parsing user from localStorage:", error);
          // Nettoyer les données corrompues
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          state.isAuthenticated = false;
        }
      } else {
        state.isAuthenticated = false;
        console.log("❌ No auth data found in localStorage");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("✅ Login fulfilled:", action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        console.log("❌ Login rejected:", action.payload);
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        // Nettoyer en cas d'erreur
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })

      // REGISTER
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        console.log("✅ Register fulfilled:", action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        console.log("❌ Register rejected:", action.payload);
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      })

      // LOAD USER
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        console.log("✅ User loaded:", action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        console.log("❌ Load user rejected:", action.payload);
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })

      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, initializeAuth } = authSlice.actions; // 🔥 REMPLACEZ checkAuth par initializeAuth
export default authSlice.reducer;
