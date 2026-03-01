import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiHeart, FiMessageCircle, FiShare2, FiMapPin, FiClock, FiPlus } from "react-icons/fi";
import StarRating from "./StarRating.jsx";
import { toggleLike } from "../features/posts/postsSlice.js";
import { followFromFeed } from "../features/feed/feedSlice.js";
import toast from "react-hot-toast";

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
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { followingIds } = useSelector((state) => state.feed);

	const isOwnPost = currentUser?.id === post.user.id;
	const isFollowing = followingIds.includes(post.user.id);

	const handleLike = () => {
		dispatch(toggleLike(post.id));
	};

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

	return (
		<div className="card group animate-fade-in">
			{/* Image */}
			<Link to={`/posts/${post.id}`} className="block relative overflow-hidden">
				<img
					src={post.imageUrl}
					alt={post.restaurantName}
					className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				{/* Rating badge on image */}
				<div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm dark:bg-gray-800/90">
					<span className="text-yellow-500 text-sm">★</span>
					<span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{post.rating}</span>
				</div>
			</Link>

			<div className="p-5">
				{/* User info row */}
				<div className="mb-3 flex items-center justify-between">
					<Link to={`/profile/${post.user.id}`} className="flex items-center gap-2.5 group/user">
						<div className="relative">
							{post.user.avatarUrl ? (
								<img
									src={post.user.avatarUrl}
									alt={post.user.name}
									className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
								/>
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
					</Link>
					<span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
						<FiClock size={12} />
						{timeAgo(post.createdAt)}
					</span>
				</div>

				{/* Restaurant info */}
				<Link to={`/posts/${post.id}`} className="block">
					<h3 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors leading-snug dark:text-gray-100">
						{post.restaurantName}
					</h3>
				</Link>
				<p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
					<FiMapPin size={13} className="text-primary-400" />
					{post.restaurantAddress}
				</p>

				{/* Description */}
				<p className="mt-3 line-clamp-2 text-sm text-gray-600 leading-relaxed dark:text-gray-400">
					{post.description}
				</p>

				{/* Actions */}
				<div className="mt-4 flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-700">
					<button
						onClick={handleLike}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20 transition-all duration-200"
					>
						<FiHeart size={16} />
						<span className="font-medium">{post._count?.likes || 0}</span>
					</button>
					<Link
						to={`/posts/${post.id}`}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:bg-primary-900/20 transition-all duration-200"
					>
						<FiMessageCircle size={16} />
						<span className="font-medium">{post._count?.comments || 0}</span>
					</Link>
					<button
						onClick={handleShare}
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-400 dark:hover:bg-primary-900/20 transition-all duration-200 ml-auto"
					>
						<FiShare2 size={16} />
						<span className="font-medium">Share</span>
					</button>
				</div>
			</div>
		</div>
	);
}
