import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api.js";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchExplorePosts = createAsyncThunk(
	"explore/fetchExplorePosts",
	async ({ sortBy = "trending", page = 1, limit = 21 } = {}, { rejectWithValue }) => {
		try {
			const { data } = await api.get(`/posts/explore?sortBy=${sortBy}&page=${page}&limit=${limit}`);
			return { ...data.data, sortBy, page };
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const fetchTopRestaurants = createAsyncThunk(
	"explore/fetchTopRestaurants",
	async (_, { rejectWithValue }) => {
		try {
			const { data } = await api.get("/posts/top-restaurants?limit=10");
			return data.data.restaurants;
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
	sortBy: "trending",
	topRestaurants: [],
	restaurantsLoading: false,
};

const exploreSlice = createSlice({
	name: "explore",
	initialState,
	reducers: {
		setSortBy(state, action) {
			if (state.sortBy !== action.payload) {
				state.sortBy = action.payload;
				state.posts = [];
				state.pagination = null;
			}
		},
		updateExplorePostReactions(state, action) {
			const { postId, reactions } = action.payload;
			const post = state.posts.find((p) => p.id === postId);
			if (post) post.reactions = reactions;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchExplorePosts.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchExplorePosts.fulfilled, (state, action) => {
				state.loading = false;
				const { posts, pagination, sortBy } = action.payload;
				if (pagination.page === 1) {
					state.posts = posts;
				} else {
					state.posts = [...state.posts, ...posts];
				}
				state.pagination = pagination;
				state.sortBy = sortBy;
			})
			.addCase(fetchExplorePosts.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		builder
			.addCase(fetchTopRestaurants.pending, (state) => {
				state.restaurantsLoading = true;
			})
			.addCase(fetchTopRestaurants.fulfilled, (state, action) => {
				state.restaurantsLoading = false;
				state.topRestaurants = action.payload;
			})
			.addCase(fetchTopRestaurants.rejected, (state) => {
				state.restaurantsLoading = false;
			});
	},
});

export const { setSortBy, updateExplorePostReactions } = exploreSlice.actions;
export default exploreSlice.reducer;
