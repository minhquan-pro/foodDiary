import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState, useRef, useEffect } from "react";
import {
	FiMessageCircle,
	FiShare2,
	FiMapPin,
	FiClock,
	FiPlus,
	FiMoreHorizontal,
	FiSlash,
	FiFlag,
	FiSmile,
	FiBookmark,
} from "react-icons/fi";
import StarRating from "./StarRating.jsx";
import ImageLightbox from "./ImageLightbox.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import CommentsModal from "./CommentsModal.jsx";
import Spinner from "./Spinner.jsx";
import api from "../lib/api.js";
import { updatePostReactions, setFeedUserReaction } from "../features/feed/feedSlice.js";
import { toggleBookmark } from "../features/posts/postsSlice.js";
import { updateProfilePostReactions, setProfileUserReaction } from "../features/profile/profileSlice.js";
import { followFromFeed, blockFromFeed, reportFromFeed } from "../features/feed/feedSlice.js";
import toast from "react-hot-toast";

const EMOJIS = ["❤️", "😂", "🔥", "👍", "😮", "😢"];
const EMOJI_LABELS = { "❤️": "Love", "😂": "Haha", "🔥": "Fire", "👍": "Like", "😮": "Wow", "😢": "Sad" };
const EMOJI_COLORS = {
	"❤️": "#ef4444",
	"😂": "#eab308",
	"🔥": "#f97316",
	"👍": "#3b82f6",
	"😮": "#eab308",
	"😢": "#60a5fa",
};

function timeAgo(dateStr) {
	const now = new Date();
	const date = new Date(dateStr);
	const seconds = Math.floor((now - date) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString();
}

export default function PostCard({ post }) {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);
	const {
		followingIds,
		userReactedPosts: feedReactedPosts,
		bookmarkedPostIds: feedBookmarked,
	} = useSelector((state) => state.feed);
	const { userReactedPosts: profileReactedPosts, bookmarkedPostIds: profileBookmarked } = useSelector(
		(state) => state.profile,
	);

	const isOwnPost = currentUser?.id === post.user.id;
	const isFollowing = followingIds.includes(post.user.id);
	const userReaction = feedReactedPosts[post.id] ?? profileReactedPosts[post.id] ?? null;
	const isBookmarked = feedBookmarked.includes(post.id) || profileBookmarked.includes(post.id);

	const [menuOpen, setMenuOpen] = useState(false);
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [reportOpen, setReportOpen] = useState(false);
	const [reportReason, setReportReason] = useState("spam");
	const [reportDetails, setReportDetails] = useState("");
	const [showPicker, setShowPicker] = useState(false);
	const menuRef = useRef(null);
	const pickerLeaveTimer = useRef(null);

	const [reactionModal, setReactionModal] = useState({ open: false, activeTab: "all", allUsers: [], loading: false });
	const openReactionModal = async (tab = "all") => {
		setReactionModal({ open: true, activeTab: tab, allUsers: [], loading: true });
		try {
			const { data } = await api.get(`/posts/${post.id}/reactions/users`);
			setReactionModal((prev) => ({ ...prev, allUsers: data.data.users || [], loading: false }));
		} catch {
			setReactionModal((prev) => ({ ...prev, loading: false }));
		}
	};

	// Close menu on outside click
	useEffect(() => {
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuOpen(false);
			}
		};
		if (menuOpen) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	const handleFollow = (e) => {
		e.preventDefault();
		e.stopPropagation();
		dispatch(followFromFeed(post.user.id));
		toast.success(`Followed ${post.user.name}`);
	};

	const handleShare = () => {
		const shareUrl = `${window.location.origin}/share/${post.shareSlug}`;
		navigator.clipboard.writeText(shareUrl);
		toast.success("Share link copied to clipboard!");
	};

	const handleEmojiClick = async (emoji) => {
		if (!currentUser) {
			toast.error("Please login to react");
			return;
		}

		const prevReaction = userReaction;
		const nextReaction = prevReaction === emoji ? null : emoji;

		// Optimistic: update user reaction state
		dispatch(setFeedUserReaction({ postId: post.id, emoji: nextReaction }));
		dispatch(setProfileUserReaction({ postId: post.id, emoji: nextReaction }));

		// Optimistic: update reaction counts (one-per-user logic)
		const current = (post.reactions || []).map((r) => ({ ...r }));
		let next = [...current];

		if (prevReaction) {
			const oldIdx = next.findIndex((r) => r.emoji === prevReaction);
			if (oldIdx !== -1) {
				next[oldIdx] = { ...next[oldIdx], count: next[oldIdx].count - 1 };
				if (next[oldIdx].count <= 0) next.splice(oldIdx, 1);
			}
		}
		if (nextReaction) {
			const newIdx = next.findIndex((r) => r.emoji === nextReaction);
			if (newIdx !== -1) {
				next[newIdx] = { ...next[newIdx], count: next[newIdx].count + 1 };
			} else {
				next.push({ emoji: nextReaction, count: 1 });
			}
		}

		dispatch(updatePostReactions({ postId: post.id, reactions: next }));
		dispatch(updateProfilePostReactions({ postId: post.id, reactions: next }));

		try {
			await api.post(`/posts/${post.id}/reactions`, { emoji });
		} catch (err) {
			toast.error(err.message || "Failed to react");
			// Revert
			dispatch(setFeedUserReaction({ postId: post.id, emoji: prevReaction }));
			dispatch(setProfileUserReaction({ postId: post.id, emoji: prevReaction }));
		}
	};

	const handleReactionBtnClick = () => {
		if (userReaction) {
			handleEmojiClick(userReaction); // remove current reaction
		} else {
			handleEmojiClick("❤️"); // default to love
		}
	};

	const handlePickerMouseEnter = () => {
		clearTimeout(pickerLeaveTimer.current);
		setShowPicker(true);
	};

	const handlePickerMouseLeave = () => {
		pickerLeaveTimer.current = setTimeout(() => setShowPicker(false), 250);
	};

	const handleBlock = () => {
		setMenuOpen(false);
		dispatch(blockFromFeed(post.user.id));
		toast.success(`Blocked ${post.user.name}`);
	};

	const handleReportSubmit = () => {
		dispatch(reportFromFeed({ userId: post.user.id, reason: reportReason, details: reportDetails }));
		toast.success("Report submitted. Thank you!");
		setReportOpen(false);
		setReportReason("spam");
		setReportDetails("");
	};

	const handleClickPost = (e) => {
		e.preventDefault();
		navigate(`/posts/${post.id}`);
	};

	const totalReactions = (post.reactions || []).reduce((sum, r) => sum + r.count, 0);

	return (
		<div className="card group animate-fade-in min-h-80 flex flex-col">
			{/* Image */}
			<div className="block relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
				{/* Rating badge on image */}
				<div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm dark:bg-gray-800/90 pointer-events-none">
					<span className="text-yellow-500 text-sm">★</span>
					<span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{post.rating}</span>
				</div>
			</div>

			<div className="flex flex-col justify-between h-full ">
				<div className="p-5">
					{/* User info row */}
					<div className="mb-3 flex items-center justify-between">
						<Link to={`/profile/${post.user.id}`} className="flex items-center gap-2 group/user">
							<div className="relative">
								{post.user.avatarUrl ? (
									<ImageLightbox src={post.user.avatarUrl} alt={post.user.name}>
										<img
											src={post.user.avatarUrl}
											alt={post.user.name}
											className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
										/>
									</ImageLightbox>
								) : (
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700 dark:from-primary-900/50 dark:to-primary-800/50 dark:text-primary-400">
										{post.user.name.charAt(0).toUpperCase()}
									</div>
								)}
								{/* Follow badge */}
								{!isOwnPost && !isFollowing && (
									<button
										onClick={handleFollow}
										className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-white hover:bg-blue-600 transition-colors shadow-sm dark:ring-gray-800"
										title={`Follow ${post.user.name}`}
									>
										<FiPlus size={12} strokeWidth={3} />
									</button>
								)}
							</div>
							<span className="font-semibold text-gray-800 group-hover/user:text-primary-600 transition-colors dark:text-gray-200">
								{post.user.name}
							</span>
							<VerifiedBadge role={post.user.role} />
						</Link>
						<span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
							<FiClock size={12} />
							{timeAgo(post.createdAt)}
						</span>
						{/* Three-dot menu for block/report */}
						{!isOwnPost && (
							<div className="relative ml-1" ref={menuRef}>
								<button
									onClick={() => setMenuOpen(!menuOpen)}
									className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
								>
									<FiMoreHorizontal size={16} />
								</button>
								{menuOpen && (
									<div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-white border border-gray-200 shadow-lg py-1 animate-fade-in dark:bg-gray-800 dark:border-gray-700">
										<button
											onClick={handleBlock}
											className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
										>
											<FiSlash size={15} className="text-red-500" />
											Block user
										</button>
										<button
											onClick={() => {
												setMenuOpen(false);
												setReportOpen(true);
											}}
											className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-gray-700"
										>
											<FiFlag size={15} className="text-orange-500" />
											Report user
										</button>
									</div>
								)}
							</div>
						)}
					</div>

					<div onClick={handleClickPost} className="cursor-pointer">
						{/* Restaurant info */}
						<h2 className="block">
							<h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors leading-snug dark:text-gray-100">
								{post.restaurantName}
							</h3>
						</h2>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
							{post.dishName && (
								<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-900/20 dark:border-orange-800/40 dark:text-orange-400">
									🍽️ {post.dishName}
								</span>
							)}
							<span className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 min-w-0">
								<FiMapPin size={12} className="text-primary-400 shrink-0" />
								<span className="truncate max-w-[160px]" title={post.restaurantAddress}>
									{post.restaurantAddress}
								</span>
							</span>
						</div>

						{/* Description */}
						<p className="mt-3 line-clamp-2 text-md text-gray-700 leading-relaxed dark:text-gray-300">
							{post.description}
						</p>

						{/* Image */}
						<div
							onClick={(e) => {
								e.stopPropagation();
							}}
							className="mt-3 rounded-xl overflow-hidden cursor-pointer ring-1 ring-gray-100 dark:ring-gray-700/50"
						>
							<ImageLightbox src={post.imageUrl} alt={post.restaurantName}>
								<img
									src={post.imageUrl}
									alt={post.restaurantName}
									className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							</ImageLightbox>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60 pt-2.5 px-3 pb-3">
					{/* Left: Reaction button + counts */}
					<div className="relative flex items-center gap-0.5">
						<div
							className="relative"
							onMouseEnter={handlePickerMouseEnter}
							onMouseLeave={handlePickerMouseLeave}
						>
							{/* Floating emoji picker */}
							{showPicker && (
								<div
									className="absolute bottom-10 left-0 z-40 flex items-center gap-0.5 rounded-full bg-white shadow-xl border border-gray-100 px-2 py-1.5 dark:bg-gray-800 dark:border-gray-700 animate-fade-in"
									onMouseEnter={handlePickerMouseEnter}
									onMouseLeave={handlePickerMouseLeave}
								>
									{EMOJIS.map((e) => (
										<button
											key={e}
											onClick={() => {
												handleEmojiClick(e);
												setShowPicker(false);
											}}
											title={EMOJI_LABELS[e]}
											className={`w-9 h-9 text-xl flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 hover:bg-gray-50 dark:hover:bg-gray-700 ${
												userReaction === e ? "scale-110 bg-gray-100 dark:bg-gray-700" : ""
											}`}
										>
											{e}
										</button>
									))}
								</div>
							)}

							{/* Main reaction button — icon only */}
							<button
								onClick={handleReactionBtnClick}
								title={userReaction ? EMOJI_LABELS[userReaction] : "React"}
								className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
								style={{ color: userReaction ? EMOJI_COLORS[userReaction] : undefined }}
							>
								{userReaction ? (
									<span className="text-base leading-none">{userReaction}</span>
								) : (
									<FiSmile size={17} className="text-gray-400 dark:text-gray-500" />
								)}
							</button>
						</div>

						{/* Reaction counts summary */}
						{totalReactions > 0 && (
							<button
								onClick={() => openReactionModal("all")}
								className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-gray-100 transition-colors dark:hover:bg-gray-700"
							>
								<div className="flex">
									{[...(post.reactions || [])]
										.sort((a, b) => b.count - a.count)
										.slice(0, 3)
										.map((r) => (
											<span key={r.emoji} className="text-sm -ml-1 first:ml-0 leading-none">
												{r.emoji}
											</span>
										))}
								</div>
								<span className="text-xs text-gray-400 dark:text-gray-500">{totalReactions}</span>
							</button>
						)}
					</div>

					{/* Right: Views, Comments, Bookmark, Share */}
					<div className="flex items-center gap-0.5">
												<button
							onClick={() => setCommentsOpen(true)}
							title="Comments"
							className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-500 dark:hover:bg-primary-900/20 transition-all duration-200"
						>
							<FiMessageCircle size={15} />
							{(post._count?.comments || 0) > 0 && (
								<span className="font-medium tabular-nums">{post._count.comments}</span>
							)}
						</button>
						<button
							onClick={() => dispatch(toggleBookmark(post.id))}
							title={isBookmarked ? "Đã lưu" : "Lưu bài"}
							className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-200 ${
								isBookmarked
									? "text-primary-600 dark:text-primary-400"
									: "text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700"
							}`}
						>
							<FiBookmark size={15} className={isBookmarked ? "fill-current" : ""} />
							{(post._count?.bookmarks ?? 0) > 0 && (
								<span className="tabular-nums">{post._count.bookmarks}</span>
							)}
						</button>
						<button
							onClick={handleShare}
							title="Copy share link"
							className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-500 dark:hover:bg-primary-900/20 transition-all duration-200"
						>
							<FiShare2 size={15} />
						</button>
					</div>
				</div>
			</div>

			{/* Comments Modal */}
			{/* Reaction Users Modal */}
			{reactionModal.open && (
				<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setReactionModal((p) => ({ ...p, open: false }))}
					/>
					<div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 max-h-[80vh] flex flex-col shadow-2xl animate-fade-in">
						<div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
							<span className="font-bold text-gray-900 dark:text-gray-100">
								{reactionModal.allUsers.length}{" "}
								{reactionModal.allUsers.length === 1 ? "reaction" : "reactions"}
							</span>
							<button
								onClick={() => setReactionModal((p) => ({ ...p, open: false }))}
								className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors dark:hover:text-gray-200 dark:hover:bg-gray-700"
							>
								✕
							</button>
						</div>
						<div className="flex border-b border-gray-100 dark:border-gray-700 overflow-x-auto shrink-0">
							<button
								onClick={() => setReactionModal((p) => ({ ...p, activeTab: "all" }))}
								className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${reactionModal.activeTab === "all" ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
							>
								All {reactionModal.allUsers.length}
							</button>
							{[...(post.reactions || [])]
								.sort((a, b) => b.count - a.count)
								.map((r) => (
									<button
										key={r.emoji}
										onClick={() => setReactionModal((p) => ({ ...p, activeTab: r.emoji }))}
										className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${reactionModal.activeTab === r.emoji ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
									>
										{r.emoji} {r.count}
									</button>
								))}
						</div>
						{reactionModal.loading ? (
							<div className="flex justify-center p-8">
								<Spinner />
							</div>
						) : (
							<div className="overflow-y-auto flex-1">
								{(reactionModal.activeTab === "all"
									? reactionModal.allUsers
									: reactionModal.allUsers.filter((u) => u.emoji === reactionModal.activeTab)
								).map((u) => (
									<Link
										key={u.id}
										to={`/profile/${u.id}`}
										onClick={() => setReactionModal((p) => ({ ...p, open: false }))}
										className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
									>
										{u.avatarUrl ? (
											<img
												src={u.avatarUrl}
												alt={u.name}
												className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
											/>
										) : (
											<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700 dark:from-primary-900/50 dark:to-primary-800/50 dark:text-primary-400">
												{u.name?.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="flex items-center justify-between w-full">
											<div className="gap-1 flex items-center">
												<span className="flex-1 font-medium text-gray-800 dark:text-gray-200 truncate">
													{u.name}
												</span>
												<VerifiedBadge role={u.role} />
											</div>
											<span className="text-xl ml-1">{u.emoji}</span>
										</div>
									</Link>
								))}
								{(reactionModal.activeTab === "all"
									? reactionModal.allUsers
									: reactionModal.allUsers.filter((u) => u.emoji === reactionModal.activeTab)
								).length === 0 && (
									<div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
										No reactions yet
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

	
	
			{commentsOpen && <CommentsModal post={post} onClose={() => setCommentsOpen(false)} />}

			{/* Report Modal */}
			{reportOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setReportOpen(false)}
					/>
					<div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl animate-slide-up dark:bg-gray-800">
						<div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
							<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
								Report {post.user.name}
							</h3>
						</div>
						<div className="px-6 py-5 space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
									Reason
								</label>
								<select
									value={reportReason}
									onChange={(e) => setReportReason(e.target.value)}
									className="input"
								>
									<option value="spam">Spam</option>
									<option value="harassment">Harassment</option>
									<option value="inappropriate">Inappropriate content</option>
									<option value="fake">Fake account</option>
									<option value="other">Other</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-gray-300">
									Details (optional)
								</label>
								<textarea
									value={reportDetails}
									onChange={(e) => setReportDetails(e.target.value)}
									className="input min-h-[80px] resize-none"
									placeholder="Provide additional details..."
									rows={3}
								/>
							</div>
						</div>
						<div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
							<button onClick={() => setReportOpen(false)} className="btn-secondary text-sm">
								Cancel
							</button>
							<button
								onClick={handleReportSubmit}
								className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
							>
								<FiFlag size={14} />
								Submit Report
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
