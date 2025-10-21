import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/apiClient";

// ==================== ASYNC THUNKS ====================

// Fetch all tasks with populated patient data
export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { rejectWithValue }) => {
    try {
      console.log("🔍 Fetching tasks...");
      const response = await api.get("/tasks");
      console.log("✅ Tasks fetched:", response.data.length);
      return response.data;
    } catch (error) {
      console.error("❌ Fetch tasks error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tasks"
      );
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      console.log("🔵 Creating task:", taskData);
      const response = await api.post("/tasks", taskData);
      console.log("✅ Task created:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Create task error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to create task"
      );
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, taskData }, { rejectWithValue }) => {
    try {
      console.log("🔵 Updating task:", id, taskData);
      const response = await api.put(`/tasks/${id}`, taskData);
      console.log("✅ Task updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update task error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update task"
      );
    }
  }
);

// Update task status only
export const updateTaskStatus = createAsyncThunk(
  "tasks/updateTaskStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      console.log("🔵 Updating task status:", id, status);
      const response = await api.patch(`/tasks/${id}/status`, { status });
      console.log("✅ Task status updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Update status error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, { rejectWithValue }) => {
    try {
      console.log("🔵 Deleting task:", id);
      await api.delete(`/tasks/${id}`);
      console.log("✅ Task deleted");
      return id;
    } catch (error) {
      console.error("❌ Delete task error:", error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete task"
      );
    }
  }
);

// ==================== SLICE ====================

const tasksSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    loading: false,
    error: null,
    filters: {
      search: "",
      status: "all",
      priority: "all",
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetTasks: (state) => {
      state.tasks = [];
      state.loading = false;
      state.error = null;
      state.filters = {
        search: "",
        status: "all",
        priority: "all",
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================== FETCH TASKS ====================
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== CREATE TASK ====================
      .addCase(createTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== UPDATE TASK ====================
      .addCase(updateTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================== UPDATE STATUS ====================
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })

      // ==================== DELETE TASK ====================
      .addCase(deleteTask.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        state.error = null;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, clearError, resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
