import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import feedReducer from "../features/feed/feedSlice.js";
import postsReducer from "../features/posts/postsSlice.js";
import profileReducer from "../features/profile/profileSlice.js";

export const store = configureStore({
	reducer: {
		auth: authReducer,
		feed: feedReducer,
		posts: postsReducer,
		profile: profileReducer,
	},
	devTools: import.meta.env.DEV,
});
