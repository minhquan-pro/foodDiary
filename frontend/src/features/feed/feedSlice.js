import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";
import { toggleLike, createPost, toggleBookmark } from "../posts/postsSlice.js";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchStories = createAsyncThunk("feed/fetchStories", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/posts/stories");
		return data.data.stories;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const createStory = createAsyncThunk("feed/createStory", async ({ file, caption }, { rejectWithValue }) => {
	try {
		const formData = new FormData();
		formData.append("image", file);
		if (caption) formData.append("caption", caption);
		const { data } = await api.post("/posts/stories", formData);
		return data.data.story;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const fetchFeed = createAsyncThunk(
	"feed/fetchFeed",
	async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
		try {
			const url = `/posts/feed?page=${page}&limit=${limit}`;
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
	feedType: "latest", // "latest" | "friends"
	followingIds: [],
	blockedIds: [],
	likedPostIds: [],
	bookmarkedPostIds: [],
	userReactedPosts: {}, // { [postId]: emoji }
	stories: [],
	storiesLoading: false,
};

const feedSlice = createSlice({
	name: "feed",
	initialState,
	reducers: {
		updatePostReactions(state, action) {
			const { postId, reactions } = action.payload;
			const post = state.posts.find((p) => p.id === postId);
			if (post) {
				post.reactions = reactions;
			}
		},
		setFeedType(state, action) {
			state.feedType = action.payload;
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
		setFeedUserReaction(state, action) {
			const { postId, emoji } = action.payload;
			if (emoji == null) {
				delete state.userReactedPosts[postId];
			} else {
				state.userReactedPosts[postId] = emoji;
			}
		},
	},
	extraReducers: (builder) => {
		// Stories
		builder
			.addCase(fetchStories.pending, (state) => { state.storiesLoading = true; })
			.addCase(fetchStories.fulfilled, (state, action) => { state.storiesLoading = false; state.stories = action.payload; })
			.addCase(fetchStories.rejected, (state) => { state.storiesLoading = false; })
			.addCase(createStory.fulfilled, (state, action) => {
				// Prepend new story; replace if user already has one
				const existing = state.stories.findIndex((s) => s.userId === action.payload.userId);
				if (existing !== -1) state.stories.splice(existing, 1);
				state.stories.unshift(action.payload);
			});

		// Fetch latest feed
		builder
			.addCase(fetchFeed.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFeed.fulfilled, (state, action) => {
				state.loading = false;
				const { posts, pagination, likedPostIds = [], userReactedPosts = {}, bookmarkedPostIds = [] } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
					state.likedPostIds = likedPostIds;
					state.userReactedPosts = userReactedPosts;
					state.bookmarkedPostIds = bookmarkedPostIds;
				} else {
					state.posts = [...state.posts, ...posts];
					state.likedPostIds = [...new Set([...state.likedPostIds, ...likedPostIds])];
					state.userReactedPosts = { ...state.userReactedPosts, ...userReactedPosts };
					state.bookmarkedPostIds = [...new Set([...state.bookmarkedPostIds, ...bookmarkedPostIds])];
				}
				state.pagination = pagination;
			})
			.addCase(fetchFeed.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		// Fetch friends feed
		builder
			.addCase(fetchFriendsFeed.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFriendsFeed.fulfilled, (state, action) => {
				state.loading = false;
				const { posts, pagination, likedPostIds = [], userReactedPosts = {}, bookmarkedPostIds = [] } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
					state.likedPostIds = likedPostIds;
					state.userReactedPosts = userReactedPosts;
					state.bookmarkedPostIds = bookmarkedPostIds;
				} else {
					state.posts = [...state.posts, ...posts];
					state.likedPostIds = [...new Set([...state.likedPostIds, ...likedPostIds])];
					state.userReactedPosts = { ...state.userReactedPosts, ...userReactedPosts };
					state.bookmarkedPostIds = [...new Set([...state.bookmarkedPostIds, ...bookmarkedPostIds])];
				}
				state.pagination = pagination;
			})
			.addCase(fetchFriendsFeed.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		// Fetch following IDs
		builder.addCase(fetchFollowingIds.fulfilled, (state, action) => {
			state.followingIds = action.payload;
		});

		// Follow from feed
		builder.addCase(followFromFeed.fulfilled, (state, action) => {
			state.followingIds.push(action.payload);
		});

		// Unfollow from feed
		builder.addCase(unfollowFromFeed.fulfilled, (state, action) => {
			state.followingIds = state.followingIds.filter((id) => id !== action.payload);
		});

		// Fetch blocked IDs
		builder.addCase(fetchBlockedIds.fulfilled, (state, action) => {
			state.blockedIds = action.payload;
		});

		// Block from feed — add to blocked list and remove posts by that user
		builder.addCase(blockFromFeed.fulfilled, (state, action) => {
			state.blockedIds.push(action.payload);
			state.posts = state.posts.filter((post) => post.user.id !== action.payload);
			state.followingIds = state.followingIds.filter((id) => id !== action.payload);
		});

		// Replace optimistic post with real one on createPost success
		builder.addCase(createPost.fulfilled, (state, action) => {
			const realPost = action.payload;
			const idx = state.posts.findIndex((p) => String(p.id).startsWith("temp-"));
			if (idx !== -1) {
				state.posts[idx] = realPost;
			}
		});

		// Optimistic toggle like from feed
		builder.addCase(toggleLike.pending, (state, action) => {
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
		builder.addCase(toggleLike.rejected, (state, action) => {
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


		// Optimistic toggle bookmark from feed
		builder.addCase(toggleBookmark.pending, (state, action) => {
			const postId = action.meta.arg;
			const isBookmarked = state.bookmarkedPostIds.includes(postId);
			if (isBookmarked) {
				state.bookmarkedPostIds = state.bookmarkedPostIds.filter((id) => id !== postId);
			} else {
				state.bookmarkedPostIds.push(postId);
			}
			const post = state.posts.find((p) => p.id === postId);
			if (post?._count) post._count.bookmarks = (post._count.bookmarks ?? 0) + (isBookmarked ? -1 : 1);
		});
		builder.addCase(toggleBookmark.rejected, (state, action) => {
			const postId = action.meta.arg;
			const isBookmarked = state.bookmarkedPostIds.includes(postId);
			if (isBookmarked) {
				state.bookmarkedPostIds = state.bookmarkedPostIds.filter((id) => id !== postId);
			} else {
				state.bookmarkedPostIds.push(postId);
			}
			const post = state.posts.find((p) => p.id === postId);
			if (post?._count) post._count.bookmarks = (post._count.bookmarks ?? 0) + (isBookmarked ? -1 : 1);
		});
	},
});

export const {
	setFeedType,
	clearFeed,
	addOptimisticPost,
	removeOptimisticPost,
	updatePostReactions,
	setFeedUserReaction,
} = feedSlice.actions;
export default feedSlice.reducer;
