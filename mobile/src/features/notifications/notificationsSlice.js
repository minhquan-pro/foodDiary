import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async ({ page = 1 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/notifications?page=${page}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "notifications/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      return data.data.count;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await api.patch("/notifications/read-all");
      return true;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markRead = createAsyncThunk(
  "notifications/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────

const initialState = {
  notifications: [],
  pagination: null,
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    resetNotifications() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { notifications, pagination } = action.payload;
        if (pagination.page === 1) {
          state.notifications = notifications;
        } else {
          state.notifications = [...state.notifications, ...notifications];
        }
        state.pagination = pagination;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;
    });

    builder.addCase(markAllRead.fulfilled, (state) => {
      state.unreadCount = 0;
      state.notifications = state.notifications.map((n) => ({
        ...n,
        isRead: true,
      }));
    });

    builder.addCase(markRead.fulfilled, (state, action) => {
      const id = action.payload;
      const notif = state.notifications.find((n) => n.id === id);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });
  },
});

export const { addNotification, resetNotifications } =
  notificationsSlice.actions;
export default notificationsSlice.reducer;
