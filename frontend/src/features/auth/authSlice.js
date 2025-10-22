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

      // Sauvegarder le token
      localStorage.setItem("token", response.data.token);
      console.log(
        "💾 Token saved to localStorage:",
        localStorage.getItem("token")
      );

      return response.data; // { success: true, user: {...}, token: "..." }
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

      localStorage.setItem("token", response.data.token);
      console.log(
        "💾 Token saved to localStorage:",
        localStorage.getItem("token")
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

      return response.data.user; // direct user object
    } catch (error) {
      console.error(
        "❌ Load user error:",
        error.response?.data || error.message
      );
      localStorage.removeItem("token");
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
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: !!localStorage.getItem("token"), // true si token existe
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      console.log("🚪 Logging out...");
      localStorage.removeItem("token");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Nouvelle action pour vérifier le token au chargement de l'app
    checkAuth: (state) => {
      const token = localStorage.getItem("token");
      console.log("🔍 Checking auth, token:", token ? "exists" : "null");
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = false;
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

export const { logout, clearError, checkAuth } = authSlice.actions;
export default authSlice.reducer;
