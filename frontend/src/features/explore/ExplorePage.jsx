import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { FiCompass } from "react-icons/fi";
import { fetchExplorePosts, fetchTopRestaurants, setSortBy } from "./exploreSlice.js";
import Spinner from "../../components/Spinner.jsx";

// ─── Filter chips config ──────────────────────────────────────

const SORT_OPTIONS = [
	{ key: "trending", label: "🔥 Trending" },
	{ key: "top", label: "⭐ Top rated" },
	{ key: "newest", label: "🆕 Mới nhất" },
];

// ─── Restaurant card (horizontal scroll section) ─────────────

function RestaurantCard({ restaurant }) {
	const navigate = useNavigate();
	return (
		<button
			onClick={() =>
				restaurant.representativePostId && navigate(`/posts/${restaurant.representativePostId}`)
			}
			className="group flex-shrink-0 w-36 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
		>
			<div className="relative w-full aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
				{restaurant.imageUrl ? (
					<img
						src={restaurant.imageUrl}
						alt={restaurant.restaurantName}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						loading="lazy"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-3xl">🏪</div>
				)}
				<div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold text-white leading-tight">
					{restaurant.postCount} reviews
				</div>
			</div>
			<div className="p-2.5">
				<p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 leading-snug">
					{restaurant.restaurantName}
				</p>
				<div className="mt-0.5 flex items-center gap-1">
					<span className="text-yellow-400 text-xs leading-none">★</span>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{restaurant.avgRating.toFixed(1)}
					</span>
				</div>
			</div>
		</button>
	);
}

// ─── Instagram-style grid cell with hover overlay ────────────

function ExploreGridItem({ post }) {
	const totalReactions = (post.reactions || []).reduce((sum, r) => sum + r.count, 0);
	const topEmojis = [...(post.reactions || [])]
		.sort((a, b) => b.count - a.count)
		.slice(0, 3)
		.map((r) => r.emoji)
		.join("");

	return (
		<Link
			to={`/posts/${post.id}`}
			className="group relative block aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"
		>
			{/* Image */}
			<img
				src={post.imageUrl}
				alt={post.restaurantName}
				className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
				loading="lazy"
			/>

			{/* Hover overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 p-3">
				<p className="text-white font-bold text-sm text-center leading-snug line-clamp-2 drop-shadow">
					{post.restaurantName}
				</p>
				<div className="flex items-center gap-0.5">
					{[1, 2, 3, 4, 5].map((s) => (
						<span key={s} className={`text-xs ${s <= post.rating ? "text-yellow-400" : "text-gray-400"}`}>
							★
						</span>
					))}
					<span className="text-white text-xs font-semibold ml-1">{post.rating}</span>
				</div>
				{totalReactions > 0 && (
					<div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1">
						<span className="text-sm leading-none">{topEmojis}</span>
						<span className="text-white text-xs font-semibold">{totalReactions}</span>
					</div>
				)}
				{post._count?.comments > 0 && (
					<span className="text-gray-300 text-xs">💬 {post._count.comments}</span>
				)}
			</div>
		</Link>
	);
}

// ─── Skeleton loaders ─────────────────────────────────────────

function RestaurantSkeleton() {
	return (
		<div className="flex gap-3 overflow-hidden">
			{Array.from({ length: 5 }).map((_, i) => (
				<div
					key={i}
					className="flex-shrink-0 w-36 h-52 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
				/>
			))}
		</div>
	);
}

function GridSkeleton() {
	return (
		<div className="grid grid-cols-3 gap-1 sm:gap-2">
			{Array.from({ length: 12 }).map((_, i) => (
				<div
					key={i}
					className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
				/>
			))}
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────

export default function ExplorePage() {
	const dispatch = useDispatch();
	const { posts, pagination, loading, error, sortBy, topRestaurants, restaurantsLoading } =
		useSelector((state) => state.explore);

	useEffect(() => {
		dispatch(fetchTopRestaurants());
		dispatch(fetchExplorePosts({ sortBy: "trending", page: 1 }));
	}, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSortChange = (newSort) => {
		if (newSort === sortBy) return;
		dispatch(setSortBy(newSort));
		dispatch(fetchExplorePosts({ sortBy: newSort, page: 1 }));
	};

	const handleLoadMore = () => {
		if (!pagination || loading || pagination.page >= pagination.totalPages) return;
		dispatch(fetchExplorePosts({ sortBy, page: pagination.page + 1 }));
	};

	const isFirstLoad = loading && posts.length === 0;

	return (
		<div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
			{/* Header */}
			<div className="mb-8 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-sm">
					<FiCompass size={20} />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
						Explore
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						Khám phá nhà hàng và món ăn phổ biến
					</p>
				</div>
			</div>

			{/* ── Top Restaurants ─────────────────────────────────── */}
			<section className="mb-8">
				<h2 className="mb-3 text-base font-bold text-gray-800 dark:text-gray-200">
					🏪 Nhà hàng nổi bật
				</h2>
				{restaurantsLoading ? (
					<RestaurantSkeleton />
				) : topRestaurants.length > 0 ? (
					<div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
						{topRestaurants.map((r) => (
							<RestaurantCard key={r.restaurantName} restaurant={r} />
						))}
					</div>
				) : (
					<p className="text-sm text-gray-400 dark:text-gray-500">
						Chưa có dữ liệu nhà hàng.
					</p>
				)}
			</section>

			{/* ── Filter chips ────────────────────────────────────── */}
			<div className="mb-6 flex items-center gap-2 flex-wrap">
				{SORT_OPTIONS.map((opt) => (
					<button
						key={opt.key}
						onClick={() => handleSortChange(opt.key)}
						className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 border ${
							sortBy === opt.key
								? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white"
								: "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-500 dark:hover:text-gray-200"
						}`}
					>
						{opt.label}
					</button>
				))}
				{pagination && (
					<span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
						{pagination.total} bài
					</span>
				)}
			</div>

			{/* ── Photo grid ──────────────────────────────────────── */}
			{isFirstLoad ? (
				<GridSkeleton />
			) : error ? (
				<div className="py-24 text-center">
					<p className="text-gray-500 dark:text-gray-400">
						Không thể tải dữ liệu. Vui lòng thử lại.
					</p>
				</div>
			) : posts.length === 0 ? (
				<div className="py-24 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
						<span className="text-3xl">🍽️</span>
					</div>
					<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
						{sortBy === "trending"
							? "Chưa có bài viết nổi bật trong 7 ngày qua"
							: "Chưa có bài viết nào"}
					</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-3 gap-1 sm:gap-2">
						{posts.map((post) => (
							<ExploreGridItem key={post.id} post={post} />
						))}
					</div>

					{pagination && pagination.page < pagination.totalPages && (
						<div className="mt-10 text-center">
							<button
								onClick={handleLoadMore}
								disabled={loading}
								className="rounded-full border border-gray-300 dark:border-gray-600 px-8 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
							>
								{loading ? "Đang tải..." : "Xem thêm"}
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
