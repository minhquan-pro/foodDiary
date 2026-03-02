import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────

export const register = createAsyncThunk("auth/register", async ({ name, email, password }, { rejectWithValue }) => {
	try {
		const { data } = await api.post("/auth/register", {
			name,
			email,
			password,
		});
		await AsyncStorage.setItem("token", data.data.token);
		return data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
	try {
		const { data } = await api.post("/auth/login", { email, password });
		await AsyncStorage.setItem("token", data.data.token);
		return data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchCurrentUser = createAsyncThunk("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
	try {
		const token = await AsyncStorage.getItem("token");
		if (!token) return rejectWithValue("No token");
		const { data } = await api.get("/auth/me");
		return { user: data.data.user, token };
	} catch (err) {
		await AsyncStorage.removeItem("token");
		return rejectWithValue(err.message);
	}
});

// ─── Slice ───────────────────────────────────────────────────

const initialState = {
	user: null,
	token: null,
	loading: false,
	error: null,
	initialized: false,
};

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout(state) {
			state.user = null;
			state.token = null;
			state.error = null;
			AsyncStorage.removeItem("token");
		},
		clearError(state) {
			state.error = null;
		},
		updateUser(state, action) {
			if (state.user) {
				state.user = { ...state.user, ...action.payload };
			}
		},
	},
	extraReducers: (builder) => {
		// Register
		builder
			.addCase(register.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(register.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.user;
				state.token = action.payload.token;
			})
			.addCase(register.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		// Login
		builder
			.addCase(login.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(login.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload.user;
				state.token = action.payload.token;
			})
			.addCase(login.rejected, (state, action) => {
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
				state.user = action.payload.user;
				state.token = action.payload.token;
				state.initialized = true;
			})
			.addCase(fetchCurrentUser.rejected, (state) => {
				state.loading = false;
				state.user = null;
				state.token = null;
				state.initialized = true;
			});
	},
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
