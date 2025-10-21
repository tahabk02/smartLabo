// src/features/notifications/notificationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  FiBell,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";

const API_URL = "http://localhost:5000/api/notifications";

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

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, getAuthConfig());
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}/${notificationId}/read`,
        {},
        getAuthConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark as read"
      );
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (notificationId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/${notificationId}`, getAuthConfig());
      return notificationId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete notification"
      );
    }
  }
);

// Utility functions
export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600)
    return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400)
    return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800)
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  return time.toLocaleDateString("fr-FR");
};

export const getNotificationTypeColor = (type) => {
  const colors = {
    info: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    alert: "#ef4444",
  };
  return colors[type] || colors.info;
};

export const getNotificationIcon = (type) => {
  const icons = {
    info: <FiInfo />,
    success: <FiCheckCircle />,
    warning: <FiAlertTriangle />,
    error: <FiAlertCircle />,
    alert: <FiBell />,
  };
  return icons[type] || icons.info;
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    loading: false,
    error: null,
    filter: "all", // 'all', 'unread', 'read'
  },
  reducers: {
    setNotificationFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({
        ...n,
        unread: false,
      }));
    },
    deleteAllReadNotifications: (state) => {
      state.notifications = state.notifications.filter((n) => n.unread);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(
          (n) => n.id === action.payload.id
        );
        if (index !== -1) {
          state.notifications[index].unread = false;
        }
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(
          (n) => n.id !== action.payload
        );
      });
  },
});

// Selectors
export const selectFilteredNotifications = (state) => {
  const { notifications, filter } = state.notifications;

  switch (filter) {
    case "unread":
      return notifications.filter((n) => n.unread);
    case "read":
      return notifications.filter((n) => !n.unread);
    default:
      return notifications;
  }
};

export const selectUnreadCount = (state) => {
  return state.notifications.notifications.filter((n) => n.unread).length;
};

export const selectNotificationFilter = (state) => {
  return state.notifications.filter;
};

export const {
  setNotificationFilter,
  clearError,
  markAllNotificationsAsRead,
  deleteAllReadNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
