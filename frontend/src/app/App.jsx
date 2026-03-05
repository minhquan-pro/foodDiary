import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "../features/auth/authSlice.js";

// Layout
import Navbar from "../components/Navbar.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Spinner from "../components/Spinner.jsx";

// Pages
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import FeedPage from "../features/feed/FeedPage.jsx";
import PostDetailPage from "../features/posts/PostDetailPage.jsx";
import SharedPostPage from "../features/posts/SharedPostPage.jsx";
import ProfilePage from "../features/profile/ProfilePage.jsx";
import ExplorePage from "../features/explore/ExplorePage.jsx";
import MapPage from "../features/map/MapPage.jsx";
import BookmarksPage from "../features/bookmarks/BookmarksPage.jsx";
import ChatWidget from "../components/ChatWidget.jsx";

export default function App() {
	const dispatch = useDispatch();
	const { token, user, loading } = useSelector((state) => state.auth);

	useEffect(() => {
		if (token && !user) {
			dispatch(fetchCurrentUser());
		}
	}, [dispatch, token, user]);

	// Show spinner while re-hydrating auth
	if (token && !user && loading) return <Spinner />;

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
			<Navbar />
			<main className="pb-12">
				<Routes>
					{/* Public */}
					<Route path="/" element={<FeedPage />} />
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/share/:slug" element={<SharedPostPage />} />

					{/* Protected */}
					<Route path="/posts/:id" element={<PostDetailPage />} />
					<Route path="/profile/:id" element={<ProfilePage />} />
					<Route path="/explore" element={<ExplorePage />} />
					<Route path="/map" element={<MapPage />} />
					<Route path="/bookmarks" element={<BookmarksPage />} />
				</Routes>
			</main>
			<ChatWidget />
		</div>
	);
}
