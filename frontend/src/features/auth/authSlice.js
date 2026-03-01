import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

// ─── Async Thunks ────────────────────────────────────────────

export const registerUser = createAsyncThunk("auth/register", async (credentials, { rejectWithValue }) => {
	try {
		const { data } = await api.post("/auth/register", credentials);
		localStorage.setItem("token", data.data.token);
		return data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const loginUser = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
	try {
		const { data } = await api.post("/auth/login", credentials);
		localStorage.setItem("token", data.data.token);
		return data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/auth/me");
		return data.data.user;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

// ─── Slice ───────────────────────────────────────────────────

const initialState = {
	user: null,
	token: localStorage.getItem("token"),
	loading: false,
	error: null,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout(state) {
			state.user = null;
			state.token = null;
			state.error = null;
			localStorage.removeItem("token");
		},
		clearAuthError(state) {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		// Register
		builder
			.addCase(registerUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(registerUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.user;
				state.token = action.payload.token;
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		// Login
		builder
			.addCase(loginUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.user;
				state.token = action.payload.token;
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		// Fetch current user
		builder
			.addCase(fetchCurrentUser.pending, (state) => {
				state.loading = true;
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.loading = false;
				state.user = null;
				state.token = null;
				localStorage.removeItem("token");
			});
	},
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
