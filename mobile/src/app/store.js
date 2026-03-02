import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import feedReducer from "../features/feed/feedSlice";
import postsReducer from "../features/posts/postsSlice";
import profileReducer from "../features/profile/profileSlice";
import chatReducer from "../features/chat/chatSlice";
import notificationsReducer from "../features/notifications/notificationsSlice";

const store = configureStore({
	reducer: {
		auth: authReducer,
		feed: feedReducer,
		posts: postsReducer,
		profile: profileReducer,
		chat: chatReducer,
		notifications: notificationsReducer,
	},
});

export default store;
