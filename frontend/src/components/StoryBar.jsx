import { useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { FiPlus } from "react-icons/fi";

// Group flat stories array by userId, preserving order (own first)
export function groupStoriesByUser(stories) {
	const map = new Map();
	for (const story of stories) {
		if (!map.has(story.userId)) {
			map.set(story.userId, { userId: story.userId, user: story.user, stories: [] });
		}
		map.get(story.userId).stories.push(story);
	}
	return Array.from(map.values());
}

export default function StoryBar({ onStoryClick, onAddStory }) {
	const { user: currentUser } = useSelector((s) => s.auth);
	const { stories, storiesLoading } = useSelector((s) => s.feed);
	const scrollRef = useRef(null);

	const backendBase = import.meta.env.VITE_API_URL
		? import.meta.env.VITE_API_URL.replace("/api", "")
		: "";
	const src = (url) => (url?.startsWith("http") ? url : `${backendBase}${url}`);

	// Group stories by user
	const groups = useMemo(() => groupStoriesByUser(stories), [stories]);

	if (storiesLoading) {
		return (
			<div className="flex gap-4 overflow-x-auto py-3 px-1">
				{[...Array(5)].map((_, i) => (
					<div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
						<div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
						<div className="h-2.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div
			ref={scrollRef}
			className="flex gap-4 overflow-x-auto py-3 px-1"
			style={{ scrollbarWidth: "none" }}
		>
			{/* Add story button */}
			<button
				onClick={onAddStory}
				className="flex flex-col items-center gap-1.5 shrink-0 group"
			>
				<div className="relative">
					<div className="rounded-full p-0.5 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-primary-400 transition-colors">
						{currentUser?.avatarUrl ? (
							<img
								src={src(currentUser.avatarUrl)}
								alt={currentUser.name}
								className="h-14 w-14 rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
							/>
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-lg font-bold text-gray-500 dark:text-gray-300">
								{currentUser?.name?.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					<div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900 shadow">
						<FiPlus size={12} strokeWidth={3} className="text-white" />
					</div>
				</div>
				<span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[64px] group-hover:text-primary-600 transition-colors">
					{groups.some((g) => g.userId === currentUser?.id) ? "Thêm" : "Story"}
				</span>
			</button>

			{/* One bubble per user-group */}
			{groups.map((group, groupIdx) => {
				const isOwn = group.userId === currentUser?.id;
				const count = group.stories.length;
				return (
					<button
						key={group.userId}
						onClick={() => onStoryClick(groupIdx)}
						className="flex flex-col items-center gap-1.5 shrink-0 group"
					>
						<div className="relative">
							<div
								className={`p-0.5 rounded-full ${
									isOwn
										? "bg-gradient-to-tr from-primary-400 to-orange-400"
										: "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500"
								}`}
							>
								<div className="rounded-full p-0.5 bg-white dark:bg-gray-900">
									{group.user.avatarUrl ? (
										<img
											src={src(group.user.avatarUrl)}
											alt={group.user.name}
											className="h-14 w-14 rounded-full object-cover"
										/>
									) : (
										<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 text-lg font-bold text-primary-600 dark:text-primary-300">
											{group.user.name?.charAt(0).toUpperCase()}
										</div>
									)}
								</div>
							</div>
							{/* Story count badge */}
							{count > 1 && (
								<div className="absolute -bottom-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-800 dark:bg-gray-200 ring-2 ring-white dark:ring-gray-900 px-1">
									<span className="text-[10px] font-bold text-white dark:text-gray-900">{count}</span>
								</div>
							)}
						</div>
						<span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[64px] group-hover:text-primary-600 transition-colors">
							{isOwn ? "Bạn" : group.user.name?.split(" ").pop()}
						</span>
					</button>
				);
			})}
		</div>
	);
}
