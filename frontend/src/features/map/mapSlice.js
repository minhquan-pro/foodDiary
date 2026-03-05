import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

export const fetchMapData = createAsyncThunk("map/fetchMapData", async (_, { rejectWithValue }) => {
	try {
		const res = await api.get("/map");
		return res.data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const shareLocation = createAsyncThunk(
	"map/shareLocation",
	async ({ latitude, longitude, label, days }, { rejectWithValue }) => {
		try {
			const res = await api.post("/map/location", { latitude, longitude, label, days });
			return res.data.data.location;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	}
);

export const removeLocation = createAsyncThunk("map/removeLocation", async (_, { rejectWithValue }) => {
	try {
		await api.delete("/map/location");
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

const mapSlice = createSlice({
	name: "map",
	initialState: {
		posts: [],
		userLocations: [],
		myLocation: null,
		status: "idle", // idle | loading | succeeded | failed
		locationStatus: "idle", // idle | loading | succeeded | failed
		error: null,
	},
	reducers: {
		resetMapStatus(state) {
			state.status = "idle";
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchMapData.pending, (state) => {
				state.status = "loading";
				state.error = null;
			})
			.addCase(fetchMapData.fulfilled, (state, action) => {
				state.status = "succeeded";
				state.posts = action.payload.posts;
				state.userLocations = action.payload.userLocations;
				state.myLocation = action.payload.myLocation;
			})
			.addCase(fetchMapData.rejected, (state, action) => {
				state.status = "failed";
				state.error = action.payload;
			})
			.addCase(shareLocation.pending, (state) => {
				state.locationStatus = "loading";
			})
			.addCase(shareLocation.fulfilled, (state, action) => {
				state.locationStatus = "idle";
				state.myLocation = action.payload;
				// Update or insert in userLocations list
				const idx = state.userLocations.findIndex((ul) => ul.userId === action.payload.userId);
				if (idx >= 0) {
					state.userLocations[idx] = action.payload;
				} else {
					state.userLocations.push(action.payload);
				}
			})
			.addCase(shareLocation.rejected, (state) => {
				state.locationStatus = "idle";
			})
			.addCase(removeLocation.fulfilled, (state) => {
				if (state.myLocation) {
					state.userLocations = state.userLocations.filter((ul) => ul.userId !== state.myLocation.userId);
					state.myLocation = null;
				}
			});
	},
});

export const { resetMapStatus } = mapSlice.actions;
export default mapSlice.reducer;
