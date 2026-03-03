import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";
import { useTheme } from "../context/ThemeContext.jsx";
import { FiHome, FiPlus, FiUser, FiLogOut, FiSearch, FiSun, FiMoon, FiCompass } from "react-icons/fi";
import CreatePostModal from "./CreatePostModal.jsx";
import NotificationBell from "./NotificationBell.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import UserSearch from "./UserSearch.jsx";

export default function Navbar() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useSelector((state) => state.auth);
	const { theme, toggleTheme } = useTheme();
	const [showCreateModal, setShowCreateModal] = useState(false);

	const handleLogout = () => {
		dispatch(logout());
		navigate("/login");
	};

	const isActive = (path) => location.pathname === path;

	const navLinkClass = (path) =>
		`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
			isActive(path)
				? "bg-gray-100 text-gray-900 dark:bg-gray-700/60 dark:text-gray-100"
				: "text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
		}`;

	return (
		<>
			<nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-xl shadow-navbar dark:border-gray-700/80 dark:bg-gray-900/80">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5">
					{/* Logo */}
					<Link to="/" className="flex items-center gap-2 group shrink-0">
						<img src="/logo.svg" alt="FoodShare" className="h-8 w-8 rounded-lg" />
						<span className="text-xl font-extrabold bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] bg-clip-text text-transparent hidden sm:inline">
							FoodShare
						</span>
					</Link>

					{/* Search */}
					{user && <UserSearch />}

					{/* Right actions */}
					<div className="flex items-center gap-1 shrink-0">
						{user ? (
							<>
								{/* Primary navigation */}
								<Link to="/" className={navLinkClass("/")}>
									<FiHome size={18} />
									<span className="hidden sm:inline">Home</span>
								</Link>
								<Link to="/explore" className={navLinkClass("/explore")}>
									<FiCompass size={18} />
									<span className="hidden sm:inline">Explore</span>
								</Link>
								<NotificationBell />
								<Link to={`/profile/${user.id}`} className={navLinkClass(`/profile/${user.id}`)}>
									{user.avatarUrl ? (
										<img
											src={user.avatarUrl}
											alt={user.name}
											className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
										/>
									) : (
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
											{user.name?.charAt(0).toUpperCase()}
										</div>
									)}
								</Link>

								{/* Divider */}
								<div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />

								{/* Utility actions */}
								<button
									onClick={toggleTheme}
									className="flex items-center justify-center px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
									title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
								>
									{theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
								</button>
								<button
									onClick={handleLogout}
									className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
									title="Đăng xuất"
								>
									<FiLogOut size={18} />
									<span className="hidden sm:inline">Logout</span>
								</button>
							</>
						) : (
							/* Theme toggle khi chưa đăng nhập */
							<button
								onClick={toggleTheme}
								className="flex items-center justify-center px-3 py-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
								title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
							>
								{theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
							</button>
						)}
					</div>
				</div>
			</nav>

			{/* Floating Action Button */}
			{user && (
				<button
					onClick={() => setShowCreateModal(true)}
					title="Viết đánh giá mới"
					className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg hover:from-emerald-500 hover:to-teal-600 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
				>
					<FiPlus size={26} strokeWidth={2.5} />
				</button>
			)}

			{/* Create Review Modal */}
			<CreatePostModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
		</>
	);
}
