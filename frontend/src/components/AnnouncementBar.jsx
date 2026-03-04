import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../context/SocketContext.jsx";
import {
	fetchAnnouncements,
	createAnnouncement,
	deleteAnnouncement,
	addAnnouncement,
	removeAnnouncement,
	pruneExpired,
} from "../features/announcements/announcementsSlice.js";
import { FiPlus, FiX, FiChevronLeft, FiChevronRight, FiImage, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeLeft(expiresAt) {
	const diff = Math.abs(new Date(expiresAt).getTime() - Date.now());
	const h = Math.floor(diff / 3600000);
	if (h >= 1) return `${h}g`;
	const m = Math.floor(diff / 60000);
	return `${m}p`;
}

const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";

function imgSrc(url) {
	if (!url) return null;
	return url.startsWith("http") ? url : `${backendBase}${url}`;
}

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({ story, onClick }) {
	return (
		<button
			onClick={onClick}
			className="relative flex-shrink-0 w-28 h-40 rounded-2xl overflow-hidden shadow-md hover:scale-105 active:scale-95 transition-transform duration-150 focus:outline-none group"
		>
			{/* Background image */}
			{story.imageUrl ? (
				<img
					src={imgSrc(story.imageUrl)}
					alt={story.user?.name}
					className="absolute inset-0 w-full h-full object-cover"
				/>
			) : (
				<div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600" />
			)}

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

			{/* Avatar ring at top */}
			<div className="absolute top-2 left-1/2 -translate-x-1/2">
				{story.user?.avatarUrl ? (
					<img
						src={imgSrc(story.user.avatarUrl)}
						alt={story.user.name}
						className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
					/>
				) : (
					<div className="h-10 w-10 rounded-full ring-2 ring-white bg-primary-500 flex items-center justify-center text-sm font-bold text-white">
						{story.user?.name?.[0]?.toUpperCase()}
					</div>
				)}
			</div>

			{/* Name + time at bottom */}
			<div className="absolute bottom-2 inset-x-1.5 text-center">
				<p className="text-white text-[11px] font-semibold leading-tight truncate">
					{story.user?.name?.split(" ").slice(-1)[0]}
				</p>
			</div>
		</button>
	);
}

// ─── Add Story Card ───────────────────────────────────────────────────────────

function AddStoryCard({ onClick }) {
	return (
		<button
			onClick={onClick}
			className="relative flex-shrink-0 w-28 h-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-150 group focus:outline-none"
		>
			<div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center group-hover:bg-primary-600 transition-colors">
				<FiPlus size={22} className="text-white" strokeWidth={2.5} />
			</div>
			<span className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
				Đăng tin
			</span>
		</button>
	);
}

// ─── Story Viewer Modal ───────────────────────────────────────────────────────

function StoryViewer({ stories, startIndex, currentUserId, onClose, onDelete }) {
	const [idx, setIdx] = useState(startIndex);
	const story = stories[idx];

	useEffect(() => {
		const handler = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	if (!story) return null;

	const isOwner = story.user?.id === currentUserId;

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={onClose}>
			{/* Card */}
			<div
				className="relative w-full max-w-sm mx-4 aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Image */}
				{story.imageUrl ? (
					<img src={imgSrc(story.imageUrl)} alt="" className="absolute inset-0 w-full h-full object-cover" />
				) : (
					<div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700" />
				)}

				{/* Gradient overlays */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

				{/* Progress bar */}
				<div className="absolute top-3 inset-x-3 flex gap-1">
					{stories.map((_, i) => (
						<div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
							<div
								className={`h-full bg-white rounded-full ${i < idx ? "w-full" : i === idx ? "w-full animate-none" : "w-0"}`}
							/>
						</div>
					))}
				</div>

				{/* User info at top */}
				<div className="absolute top-7 inset-x-3 flex items-center gap-2">
					{story.user?.avatarUrl ? (
						<img
							src={imgSrc(story.user.avatarUrl)}
							alt={story.user.name}
							className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
						/>
					) : (
						<div className="h-9 w-9 rounded-full ring-2 ring-white bg-primary-500 flex items-center justify-center text-sm font-bold text-white">
							{story.user?.name?.[0]?.toUpperCase()}
						</div>
					)}
					<div>
						<p className="text-white text-sm font-semibold leading-tight">{story.user?.name}</p>
						<p className="text-white/70 text-xs">{timeLeft(story.createdAt)}</p>
					</div>
				</div>

				{/* Caption at bottom */}
				{story.message && (
					<div className="absolute bottom-6 inset-x-4">
						<p className="text-white text-sm font-medium text-center leading-snug drop-shadow">
							{story.message}
						</p>
					</div>
				)}

				{/* Close */}
				<button
					onClick={onClose}
					className="absolute top-5 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
				>
					<FiX size={16} />
				</button>

				{/* Delete button — only for owner */}
				{isOwner && (
					<button
						onClick={() => onDelete(story.id)}
						className="absolute top-5 right-14 h-8 w-8 flex items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
						title="Xóa tin"
					>
						<FiTrash2 size={15} />
					</button>
				)}
				{/* Prev / Next */}
				{idx > 0 && (
					<button
						onClick={() => setIdx((i) => i - 1)}
						className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
					>
						<FiChevronLeft size={20} />
					</button>
				)}
				{idx < stories.length - 1 && (
					<button
						onClick={() => setIdx((i) => i + 1)}
						className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
					>
						<FiChevronRight size={20} />
					</button>
				)}
			</div>
		</div>
	);
}

// ─── Create Story Modal ───────────────────────────────────────────────────────

function CreateStoryModal({ onClose, onCreate }) {
	const [image, setImage] = useState(null);
	const [preview, setPreview] = useState(null);
	const [caption, setCaption] = useState("");
	const [dragOver, setDragOver] = useState(false);
	const { creating } = useSelector((state) => state.announcements);

	useEffect(() => {
		const handler = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [onClose]);

	const processFile = (file) => {
		if (file?.type.startsWith("image/")) {
			setImage(file);
			setPreview(URL.createObjectURL(file));
		} else {
			toast.error("Chỉ chấp nhận file ảnh");
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!image) return toast.error("Vui lòng chọn ảnh");
		const fd = new FormData();
		fd.append("image", image);
		if (caption.trim()) fd.append("message", caption.trim());
		onCreate(fd);
	};

	return (
		<div
			className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
					<h2 className="text-base font-bold text-gray-900 dark:text-white">Đăng ảnh đồ ăn</h2>
					<button
						onClick={onClose}
						className="h-8 w-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					>
						<FiX size={18} />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
					{/* Image upload */}
					<label
						className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden ${
							dragOver
								? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
								: preview
									? "border-transparent"
									: "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-primary-300"
						}`}
						style={{ minHeight: preview ? "auto" : 180 }}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragOver(false);
							processFile(e.dataTransfer.files[0]);
						}}
					>
						{preview ? (
							<div className="relative w-full group">
								<img src={preview} alt="preview" className="w-full max-h-64 object-cover rounded-2xl" />
								<div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											setImage(null);
											setPreview(null);
										}}
										className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
									>
										<FiTrash2 size={12} /> Xóa ảnh
									</button>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
								<div className="h-14 w-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
									<FiImage size={28} className="text-primary-500" />
								</div>
								<div>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
										Kéo thả hoặc bấm để chọn ảnh
									</p>
									<p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP · tối đa 10MB</p>
								</div>
							</div>
						)}
						<input
							type="file"
							accept="image/*"
							className="hidden"
							onChange={(e) => processFile(e.target.files[0])}
						/>
					</label>

					{/* Caption */}
					<div className="relative">
						<textarea
							value={caption}
							onChange={(e) => setCaption(e.target.value.slice(0, 150))}
							placeholder="Thêm chú thích (không bắt buộc)..."
							rows={2}
							className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:border-primary-300 focus:bg-white dark:focus:bg-gray-800 focus:outline-none transition-colors"
						/>
						<span className="absolute bottom-2 right-2 text-xs text-gray-400">{caption.length}/150</span>
					</div>

					{/* Submit */}
					<button
						type="submit"
						disabled={creating || !image}
						className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
					>
						{creating ? "Đang đăng..." : "Đăng tin"}
					</button>
				</form>
			</div>
		</div>
	);
}

// ─── AnnouncementBar (Stories Strip) ─────────────────────────────────────────

export default function AnnouncementBar() {
	const dispatch = useDispatch();
	const { socket } = useSocket();
	const { items, status } = useSelector((state) => state.announcements);
	const { user } = useSelector((state) => state.auth);

	const [viewerIndex, setViewerIndex] = useState(null);
	const [showCreate, setShowCreate] = useState(false);

	// Fetch on mount
	useEffect(() => {
		if (status === "idle") dispatch(fetchAnnouncements());
	}, [dispatch, status]);

	// Prune expired every 60s
	useEffect(() => {
		const id = setInterval(() => dispatch(pruneExpired()), 60_000);
		return () => clearInterval(id);
	}, [dispatch]);

	// Real-time socket
	useEffect(() => {
		if (!socket) return;
		const onNew = (ann) => dispatch(addAnnouncement(ann));
		const onDeleted = ({ id }) => dispatch(removeAnnouncement(id));
		socket.on("announcement:new", onNew);
		socket.on("announcement:deleted", onDeleted);
		return () => {
			socket.off("announcement:new", onNew);
			socket.off("announcement:deleted", onDeleted);
		};
	}, [socket, dispatch]);

	const handleCreate = useCallback(
		(formData) => {
			dispatch(createAnnouncement(formData))
				.unwrap()
				.then(() => {
					setShowCreate(false);
					toast.success("Đã đăng tin!");
				})
				.catch(() => toast.error("Đăng tin thất bại"));
		},
		[dispatch],
	);

	const handleDelete = useCallback(
		(id) => {
			dispatch(deleteAnnouncement(id))
				.unwrap()
				.then(() => {
					setViewerIndex(null);
					toast.success("Đã xóa tin");
				})
				.catch(() => toast.error("Xóa thất bại"));
		},
		[dispatch],
	);

	if (!user) return null;

	return (
		<>
			{/* Stories strip */}
			<div className="border-b border-gray-200/80 dark:border-gray-700/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
				<div className="mx-auto max-w-7xl px-4 sm:px-6">
					<div className="flex gap-3 py-3 overflow-x-auto scrollbar-hide">
						{/* Add Story card */}
						<AddStoryCard onClick={() => setShowCreate(true)} />

						{/* Story cards */}
						{items.map((story, i) => (
							<StoryCard key={story.id} story={story} onClick={() => setViewerIndex(i)} />
						))}

						{/* Empty hint */}
						{items.length === 0 && status !== "loading" && (
							<div className="flex items-center px-2">
								<p className="text-xs text-gray-400 dark:text-gray-500 italic whitespace-nowrap">
									Chưa có tin nào — hãy đăng ảnh đầu tiên!
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Story Viewer */}
			{viewerIndex !== null && (
				<StoryViewer
					stories={items}
					startIndex={viewerIndex}
					currentUserId={user.id}
					onClose={() => setViewerIndex(null)}
					onDelete={handleDelete}
				/>
			)}

			{/* Create Story Modal */}
			{showCreate && <CreateStoryModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
		</>
	);
}
