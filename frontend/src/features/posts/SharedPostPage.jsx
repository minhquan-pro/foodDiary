import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPostBySlug, clearCurrentPost } from "./postsSlice.js";
import Spinner from "../../components/Spinner.jsx";
import StarRating from "../../components/StarRating.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import { FiMapPin, FiClock } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function SharedPostPage() {
	const { slug } = useParams();
	const dispatch = useDispatch();
	const { currentPost: post, loading } = useSelector((state) => state.posts);

	useEffect(() => {
		dispatch(fetchPostBySlug(slug));
		return () => dispatch(clearCurrentPost());
	}, [dispatch, slug]);

	if (loading || !post) return <Spinner />;

	return (
		<div className="mx-auto max-w-4xl px-6 py-8 animate-fade-in">
			<div className="card-static">
				<div className="relative">
					<img src={post.imageUrl} alt={post.restaurantName} className="h-[400px] w-full object-cover" />
					<div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow-md dark:bg-gray-800/90">
						<span className="text-yellow-500">★</span>
						<span className="text-sm font-bold text-gray-800 dark:text-gray-200">{post.rating}.0</span>
					</div>
				</div>
				<div className="p-8">
					<div className="mb-5 flex items-center gap-3">
						{post.user.avatarUrl ? (
							<img
								src={post.user.avatarUrl}
								alt={post.user.name}
								className="h-11 w-11 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
							/>
						) : (
							<div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700 dark:from-primary-900/50 dark:to-primary-800/50 dark:text-primary-400">
								{post.user.name.charAt(0).toUpperCase()}
							</div>
						)}
						<div>
							<p className="font-semibold text-gray-900 dark:text-gray-100">
								{post.user.name}
								<VerifiedBadge role={post.user.role} className="ml-1" />
							</p>
							<p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
								<FiClock size={11} />
								{new Date(post.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>

					<h1 className="text-3xl font-bold text-gray-900 tracking-tight dark:text-gray-100">
						{post.restaurantName}
					</h1>
					<p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
						<FiMapPin size={14} className="text-primary-400" />
						{post.restaurantAddress}
					</p>
					<div className="mt-3">
						<StarRating rating={post.rating} readOnly />
					</div>
					<p className="mt-5 text-gray-700 leading-relaxed text-[15px] dark:text-gray-300">
						{post.description}
					</p>

					<div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-700">
						<div className="rounded-2xl bg-gradient-to-r from-primary-50 to-orange-50 p-6 text-center dark:from-primary-900/20 dark:to-orange-900/20">
							<span className="text-3xl mb-3 block">🍽️</span>
							<p className="font-semibold text-gray-800 dark:text-gray-200">
								Join FoodShare to like, comment, and share your own reviews!
							</p>
							<Link to="/register" className="btn-primary btn-lg mt-4 inline-block">
								Sign Up Free
							</Link>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
