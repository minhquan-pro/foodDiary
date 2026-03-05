import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiX, FiChevronLeft, FiChevronRight, FiEye, FiTrash2 } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { deleteStory } from "../features/feed/feedSlice.js";
import VerifiedBadge from "./VerifiedBadge.jsx";
import api from "../lib/api.js";
import toast from "react-hot-toast";

const STORY_DURATION = 5000;

function timeAgo(dateStr) {
	const diff = Date.now() - new Date(dateStr);
	const s = Math.floor(diff / 1000);
	if (s < 60) return "vừa xong";
	const m = Math.floor(s / 60);
	if (m < 60) return `${m} phút trước`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} giờ trước`;
	return `${Math.floor(h / 24)} ngày trước`;
}

/**
 * groups: [{ userId, user, stories: [story, ...] }, ...]
 * initialGroupIdx: which group to open first
 */
export default function StoryViewer({ groups, initialGroupIdx = 0, onClose }) {
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((s) => s.auth);

	const [groupIdx, setGroupIdx] = useState(initialGroupIdx);
	const [storyIdx, setStoryIdx] = useState(0);
	const [progress, setProgress] = useState(0);
	const [paused, setPaused] = useState(false);
	const [viewersOpen, setViewersOpen] = useState(false);
	const [viewers, setViewers] = useState([]);
	const [viewersLoading, setViewersLoading] = useState(false);
	const intervalRef = useRef(null);
	const viewRecorded = useRef(new Set());

	const backendBase = import.meta.env.VITE_API_URL
		? import.meta.env.VITE_API_URL.replace("/api", "")
		: "";
	const src = (url) => (url?.startsWith("http") ? url : `${backendBase}${url}`);

	const group = groups[groupIdx];
	const story = group?.stories[storyIdx];
	const isOwn = story?.userId === currentUser?.id;

	// Record view
	useEffect(() => {
		if (!story || isOwn || viewRecorded.current.has(story.id)) return;
		viewRecorded.current.add(story.id);
		api.post(`/stories/${story.id}/views`).catch(() => {});
	}, [story, isOwn]);

	// Reset storyIdx when group changes
	useEffect(() => {
		setStoryIdx(0);
		setProgress(0);
		setViewersOpen(false);
	}, [groupIdx]);

	// Auto-progress
	useEffect(() => {
		setProgress(0);
		setViewersOpen(false);
		if (paused) return;

		intervalRef.current = setInterval(() => {
			setProgress((p) => {
				if (p >= 100) {
					clearInterval(intervalRef.current);
					goNext();
					return 100;
				}
				return p + 100 / (STORY_DURATION / 100);
			});
		}, 100);

		return () => clearInterval(intervalRef.current);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [groupIdx, storyIdx, paused]);

	const goNext = () => {
		const stories = group?.stories ?? [];
		if (storyIdx < stories.length - 1) {
			// Next story in same group
			setStoryIdx((i) => i + 1);
		} else if (groupIdx < groups.length - 1) {
			// Next user's group
			setGroupIdx((i) => i + 1);
		} else {
			onClose();
		}
	};

	const goPrev = () => {
		if (storyIdx > 0) {
			// Previous story in same group
			setStoryIdx((i) => i - 1);
		} else if (groupIdx > 0) {
			// Go to last story of previous group
			const prevGroup = groups[groupIdx - 1];
			setGroupIdx((i) => i - 1);
			setStoryIdx(prevGroup.stories.length - 1);
		}
	};

	const openViewers = async () => {
		setViewersOpen(true);
		setPaused(true);
		setViewersLoading(true);
		try {
			const { data } = await api.get(`/stories/${story.id}/viewers`);
			setViewers(data.data.viewers || []);
		} catch {
			// silent
		} finally {
			setViewersLoading(false);
		}
	};

	const handleDelete = async () => {
		const storyId = story.id;
		const stories = group.stories;
		try {
			await dispatch(deleteStory(storyId)).unwrap();
			toast.success("Đã xoá story");

			if (stories.length <= 1) {
				// No more stories in this group
				if (groups.length <= 1) {
					onClose();
				} else if (groupIdx >= groups.length - 1) {
					setGroupIdx((i) => i - 1);
				}
				// groupIdx stays, group will be gone from Redux → viewer closes naturally
			} else {
				// Stay in same group, go to next or prev story
				if (storyIdx >= stories.length - 1) {
					setStoryIdx((i) => i - 1);
				}
				// else stay at same index (next story slides in)
			}
		} catch {
			toast.error("Xoá thất bại");
		}
	};

	if (!story || !group) return null;

	const stories = group.stories;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
			{/* Close */}
			<button
				onClick={onClose}
				className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
			>
				<FiX size={20} />
			</button>

			{/* Story card */}
			<div className="relative w-full max-w-sm h-[100dvh] sm:h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col bg-black">

				{/* Progress bars — one per story in current group */}
				<div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
					{stories.map((s, i) => (
						<div key={s.id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
							<div
								className="h-full bg-white rounded-full transition-none"
								style={{
									width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%",
								}}
							/>
						</div>
					))}
				</div>

				{/* Header */}
				<div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-4 pt-2">
					<div className="flex items-center gap-3">
						{group.user.avatarUrl ? (
							<img src={src(group.user.avatarUrl)} alt={group.user.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/50" />
						) : (
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white ring-2 ring-white/50">
								{group.user.name?.charAt(0).toUpperCase()}
							</div>
						)}
						<div>
							<div className="flex items-center gap-1">
								<Link to={`/profile/${group.user.id}`} onClick={onClose} className="text-sm font-semibold text-white hover:underline">
									{group.user.name}
								</Link>
								<VerifiedBadge role={group.user.role} />
							</div>
							<p className="text-xs text-white/60">
								{timeAgo(story.createdAt)}
								{stories.length > 1 && (
									<span className="ml-1 text-white/40">· {storyIdx + 1}/{stories.length}</span>
								)}
							</p>
						</div>
					</div>

					{isOwn && (
						<button onClick={handleDelete} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-red-400 hover:bg-black/60 transition-colors">
							<FiTrash2 size={15} />
						</button>
					)}
				</div>

				{/* Image */}
				<img
					src={src(story.imageUrl)}
					alt="story"
					className="w-full h-full object-cover select-none"
					onMouseDown={() => setPaused(true)}
					onMouseUp={() => setPaused(false)}
					onTouchStart={() => setPaused(true)}
					onTouchEnd={() => setPaused(false)}
					draggable={false}
				/>

				{/* Bottom overlay */}
				<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 pb-4 px-4 z-10">
					{story.caption && (
						<p className="text-white text-sm font-medium leading-snug mb-2">{story.caption}</p>
					)}
					{isOwn && (
						<button
							onClick={openViewers}
							className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm text-white hover:bg-white/25 transition-colors"
						>
							<FiEye size={15} />
							<span>{story._count?.views ?? 0} lượt xem</span>
						</button>
					)}
				</div>

				{/* Tap zones for prev/next */}
				<button
					onClick={goPrev}
					disabled={groupIdx === 0 && storyIdx === 0}
					className="absolute left-0 top-0 h-full w-1/3 z-10"
				/>
				<button
					onClick={goNext}
					className="absolute right-0 top-0 h-full w-1/3 z-10"
				/>

				{/* Chevron hints */}
				{(groupIdx > 0 || storyIdx > 0) && (
					<div className="absolute left-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30">
							<FiChevronLeft size={20} className="text-white" />
						</div>
					</div>
				)}
				<div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30">
						<FiChevronRight size={20} className="text-white" />
					</div>
				</div>
			</div>

			{/* Viewers panel */}
			{viewersOpen && (
				<div className="absolute inset-x-0 bottom-0 max-w-sm mx-auto z-20 rounded-t-2xl bg-white dark:bg-gray-900 max-h-[50vh] flex flex-col shadow-2xl">
					<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
						<div className="flex items-center gap-2">
							<FiEye size={16} className="text-blue-500" />
							<span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
								{viewers.length} người đã xem
							</span>
						</div>
						<button
							onClick={() => { setViewersOpen(false); setPaused(false); }}
							className="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<FiX size={16} />
						</button>
					</div>
					{viewersLoading ? (
						<div className="flex justify-center p-6">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
						</div>
					) : viewers.length === 0 ? (
						<div className="py-10 text-center text-sm text-gray-400">Chưa có ai xem story này</div>
					) : (
						<div className="overflow-y-auto flex-1">
							{viewers.map((u) => (
								<Link
									key={u.id}
									to={`/profile/${u.id}`}
									onClick={onClose}
									className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
								>
									{u.avatarUrl ? (
										<img src={src(u.avatarUrl)} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
									) : (
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
											{u.name?.charAt(0).toUpperCase()}
										</div>
									)}
									<div className="flex items-center justify-between w-full min-w-0">
										<div className="flex items-center gap-1 min-w-0">
											<span className="font-medium text-gray-800 dark:text-gray-200 truncate text-sm">{u.name}</span>
											<VerifiedBadge role={u.role} />
										</div>
										<span className="text-xs text-gray-400 shrink-0 ml-2">{timeAgo(u.viewedAt)}</span>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
