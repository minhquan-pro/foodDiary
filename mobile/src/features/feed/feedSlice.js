import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchFeed = createAsyncThunk(
	"feed/fetchFeed",
	async ({ page = 1, limit = 10, location = null } = {}, { rejectWithValue }) => {
		try {
			let url = `/posts/feed?page=${page}&limit=${limit}`;
			if (location) url += `&location=${encodeURIComponent(location)}`;
			const { data } = await api.get(url);
			return data.data;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const fetchFriendsFeed = createAsyncThunk(
	"feed/fetchFriendsFeed",
	async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
		try {
			const { data } = await api.get(`/posts/friends?page=${page}&limit=${limit}`);
			return data.data;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const fetchLocations = createAsyncThunk("feed/fetchLocations", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/posts/locations");
		return data.data.locations;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchFollowingIds = createAsyncThunk("feed/fetchFollowingIds", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/users/following/ids");
		return data.data.followingIds;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const followFromFeed = createAsyncThunk("feed/followFromFeed", async (userId, { rejectWithValue }) => {
	try {
		await api.post(`/users/${userId}/follow`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const unfollowFromFeed = createAsyncThunk("feed/unfollowFromFeed", async (userId, { rejectWithValue }) => {
	try {
		await api.delete(`/users/${userId}/follow`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchBlockedIds = createAsyncThunk("feed/fetchBlockedIds", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/blocks/ids");
		return data.data.blockedIds;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const blockFromFeed = createAsyncThunk("feed/blockFromFeed", async (userId, { rejectWithValue }) => {
	try {
		await api.post(`/blocks/${userId}`);
		return userId;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const reportFromFeed = createAsyncThunk(
	"feed/reportFromFeed",
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
	posts: [],
	pagination: null,
	loading: false,
	error: null,
	feedType: "latest",
	locations: [],
	selectedLocation: null,
	followingIds: [],
	blockedIds: [],
	likedPostIds: [],
};

const feedSlice = createSlice({
	name: "feed",
	initialState,
	reducers: {
		setFeedType(state, action) {
			state.feedType = action.payload;
			state.posts = [];
			state.pagination = null;
		},
		setSelectedLocation(state, action) {
			state.selectedLocation = action.payload;
			state.posts = [];
			state.pagination = null;
		},
		clearFeed(state) {
			state.posts = [];
			state.pagination = null;
		},
		addOptimisticPost(state, action) {
			state.posts.unshift(action.payload);
		},
		removeOptimisticPost(state, action) {
			state.posts = state.posts.filter((p) => p.id !== action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchFeed.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFeed.fulfilled, (state, action) => {
				state.loading = false;
				const { posts, pagination, likedPostIds = [] } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
					state.likedPostIds = likedPostIds;
				} else {
					state.posts = [...state.posts, ...posts];
					state.likedPostIds = [...new Set([...state.likedPostIds, ...likedPostIds])];
				}
				state.pagination = pagination;
			})
			.addCase(fetchFeed.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		builder
			.addCase(fetchFriendsFeed.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFriendsFeed.fulfilled, (state, action) => {
				state.loading = false;
				const { posts, pagination, likedPostIds = [] } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
					state.likedPostIds = likedPostIds;
				} else {
					state.posts = [...state.posts, ...posts];
					state.likedPostIds = [...new Set([...state.likedPostIds, ...likedPostIds])];
				}
				state.pagination = pagination;
			})
			.addCase(fetchFriendsFeed.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		builder.addCase(fetchLocations.fulfilled, (state, action) => {
			state.locations = action.payload;
		});

		builder.addCase(fetchFollowingIds.fulfilled, (state, action) => {
			state.followingIds = action.payload;
		});

		builder.addCase(followFromFeed.fulfilled, (state, action) => {
			state.followingIds.push(action.payload);
		});

		builder.addCase(unfollowFromFeed.fulfilled, (state, action) => {
			state.followingIds = state.followingIds.filter((id) => id !== action.payload);
		});

		builder.addCase(fetchBlockedIds.fulfilled, (state, action) => {
			state.blockedIds = action.payload;
		});

		builder.addCase(blockFromFeed.fulfilled, (state, action) => {
			state.blockedIds.push(action.payload);
			state.posts = state.posts.filter((post) => post.user.id !== action.payload);
			state.followingIds = state.followingIds.filter((id) => id !== action.payload);
		});

		// Optimistic toggle like
		builder.addCase("posts/toggleLike/pending", (state, action) => {
			const postId = action.meta.arg;
			const isLiked = state.likedPostIds.includes(postId);
			if (isLiked) {
				state.likedPostIds = state.likedPostIds.filter((id) => id !== postId);
			} else {
				state.likedPostIds.push(postId);
			}
			const post = state.posts.find((p) => p.id === postId);
			if (post) {
				post._count.likes += isLiked ? -1 : 1;
			}
		});
		builder.addCase("posts/toggleLike/rejected", (state, action) => {
			const postId = action.meta.arg;
			const isLiked = state.likedPostIds.includes(postId);
			if (isLiked) {
				state.likedPostIds = state.likedPostIds.filter((id) => id !== postId);
			} else {
				state.likedPostIds.push(postId);
			}
			const post = state.posts.find((p) => p.id === postId);
			if (post) {
				post._count.likes += isLiked ? -1 : 1;
			}
		});

		// Replace optimistic post with real one
		builder.addCase("posts/createPost/fulfilled", (state, action) => {
			const realPost = action.payload;
			const idx = state.posts.findIndex((p) => String(p.id).startsWith("temp-"));
			if (idx !== -1) {
				state.posts[idx] = realPost;
			}
		});
	},
});

export const { setFeedType, setSelectedLocation, clearFeed, addOptimisticPost, removeOptimisticPost } =
	feedSlice.actions;
export default feedSlice.reducer;
