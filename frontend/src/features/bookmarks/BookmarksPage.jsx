import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSavedPosts } from "../profile/profileSlice.js";
import PostCard from "../../components/PostCard.jsx";
import { FiBookmark } from "react-icons/fi";

export default function BookmarksPage() {
	const dispatch = useDispatch();
	const { savedPosts, savedPagination, savedLoading } = useSelector((state) => state.profile);

	useEffect(() => {
		dispatch(fetchSavedPosts({ page: 1 }));
	}, [dispatch]);

	const handleLoadMore = () => {
		if (!savedPagination || savedPagination.page >= savedPagination.totalPages) return;
		dispatch(fetchSavedPosts({ page: savedPagination.page + 1 }));
	};

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			<div className="flex items-center gap-3 mb-6">
				<FiBookmark size={22} className="text-primary-500" />
				<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bài viết đã lưu</h1>
			</div>

			{savedLoading && savedPosts.length === 0 ? (
				<div className="py-16 text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
				</div>
			) : savedPosts.length === 0 ? (
				<div className="py-16 text-center">
					<FiBookmark size={40} className="mx-auto text-gray-200 mb-3 dark:text-gray-600" />
					<p className="text-gray-400 dark:text-gray-500">Chưa có bài viết nào được lưu.</p>
				</div>
			) : (
				<div className="flex flex-col gap-5">
					{savedPosts.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
				</div>
			)}

			{savedPagination && savedPagination.page < savedPagination.totalPages && (
				<div className="mt-8 text-center">
					<button onClick={handleLoadMore} disabled={savedLoading} className="btn-outline btn-lg disabled:opacity-50">
						{savedLoading ? "Đang tải..." : "Xem thêm"}
					</button>
				</div>
			)}
		</div>
	);
}
