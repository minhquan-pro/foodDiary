import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchProfile = createAsyncThunk("profile/fetchProfile", async (userId, { rejectWithValue }) => {
	try {
		const { data } = await api.get(`/users/${userId}`);
		return data.data;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchUserPosts = createAsyncThunk(
	"profile/fetchUserPosts",
	async ({ userId, page = 1 }, { rejectWithValue }) => {
		try {
			const { data } = await api.get(`/users/${userId}/posts?page=${page}&limit=10`);
			return data.data;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const updateProfile = createAsyncThunk("profile/updateProfile", async (formData, { rejectWithValue }) => {
	try {
		const { data } = await api.patch("/users/profile", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		return data.data.user;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const followUser = createAsyncThunk("profile/followUser", async (userId, { rejectWithValue }) => {
	try {
		await api.post(`/users/${userId}/follow`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const unfollowUser = createAsyncThunk("profile/unfollowUser", async (userId, { rejectWithValue }) => {
	try {
		await api.delete(`/users/${userId}/follow`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const blockUser = createAsyncThunk("profile/blockUser", async (userId, { rejectWithValue }) => {
	try {
		await api.post(`/blocks/${userId}`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const unblockUser = createAsyncThunk("profile/unblockUser", async (userId, { rejectWithValue }) => {
	try {
		await api.delete(`/blocks/${userId}`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const reportUser = createAsyncThunk(
	"profile/reportUser",
	async ({ userId, reason, details }, { rejectWithValue }) => {
		try {
			await api.post(`/reports/${userId}`, { reason, details });
			return userId;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

// ─── Slice ───────────────────────────────────────────────────

const initialState = {
	profile: null,
	posts: [],
	postsPagination: null,
	likedPostIds: [],
	isFollowing: false,
	isBlocked: false,
	loading: false,
	postsLoading: false,
	error: null,
};

const profileSlice = createSlice({
	name: "profile",
	initialState,
	reducers: {
		clearProfile(state) {
			state.profile = null;
			state.posts = [];
			state.postsPagination = null;
			state.likedPostIds = [];
			state.isFollowing = false;
			state.isBlocked = false;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProfile.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchProfile.fulfilled, (state, action) => {
				state.loading = false;
				state.profile = action.payload.user;
				state.isFollowing = action.payload.isFollowing || false;
				state.isBlocked = action.payload.isBlocked || false;
			})
			.addCase(fetchProfile.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		builder
			.addCase(fetchUserPosts.pending, (state) => {
				state.postsLoading = true;
			})
			.addCase(fetchUserPosts.fulfilled, (state, action) => {
				state.postsLoading = false;
				const { posts, pagination, likedPostIds = [] } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
					state.likedPostIds = likedPostIds;
				} else {
					state.posts = [...state.posts, ...posts];
					state.likedPostIds = [...new Set([...state.likedPostIds, ...likedPostIds])];
				}
				state.postsPagination = pagination;
			})
			.addCase(fetchUserPosts.rejected, (state) => {
				state.postsLoading = false;
			});

		builder.addCase(updateProfile.fulfilled, (state, action) => {
			state.profile = { ...state.profile, ...action.payload };
		});

		builder.addCase(followUser.fulfilled, (state) => {
			state.isFollowing = true;
			if (state.profile) {
				state.profile._count.followers += 1;
			}
		});

		builder.addCase(unfollowUser.fulfilled, (state) => {
			state.isFollowing = false;
			if (state.profile) {
				state.profile._count.followers -= 1;
			}
		});

		builder.addCase(blockUser.fulfilled, (state) => {
			state.isBlocked = true;
			state.isFollowing = false;
		});

		builder.addCase(unblockUser.fulfilled, (state) => {
			state.isBlocked = false;
		});
	},
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
