import { useRef } from "react";
import { useSelector } from "react-redux";
import { FiPlus } from "react-icons/fi";
import Spinner from "./Spinner.jsx";

export default function StoryBar({ onStoryClick, onAddStory }) {
	const { user: currentUser } = useSelector((s) => s.auth);
	const { stories, storiesLoading } = useSelector((s) => s.feed);
	const scrollRef = useRef(null);

	const hasOwnStory = stories.some((s) => s.userId === currentUser?.id);

	if (storiesLoading) {
		return (
			<div className="flex gap-4 overflow-x-auto py-3 px-1">
				{[...Array(4)].map((_, i) => (
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
			className="flex gap-4 overflow-x-auto py-3 px-1 scrollbar-hide"
			style={{ scrollbarWidth: "none" }}
		>
			{/* Add story button (always visible) */}
			<button
				onClick={onAddStory}
				className="flex flex-col items-center gap-1.5 shrink-0 group"
			>
				<div className="relative">
					<div className="rounded-full p-0.5 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-primary-400 transition-colors">
						{currentUser?.avatarUrl ? (
							<img
								src={currentUser.avatarUrl}
								alt={currentUser.name}
								className="h-14 w-14 rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
							/>
						) : (
							<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-lg font-bold text-gray-500 dark:text-gray-300">
								{currentUser?.name?.charAt(0).toUpperCase()}
							</div>
						)}
					</div>
					{/* Plus badge */}
					<div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900 shadow">
						<FiPlus size={12} strokeWidth={3} className="text-white" />
					</div>
				</div>
				<span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[64px] group-hover:text-primary-600 transition-colors">
					Thêm story
				</span>
			</button>

			{/* Stories list */}
			{stories.map((story, i) => {
				const isOwn = story.userId === currentUser?.id;
				return (
					<button
						key={story.id}
						onClick={() => onStoryClick(i)}
						className="flex flex-col items-center gap-1.5 shrink-0 group"
					>
						<div
							className={`p-0.5 rounded-full ${
								isOwn
									? "bg-gradient-to-tr from-primary-400 to-orange-400"
									: "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500"
							}`}
						>
							<div className="rounded-full p-0.5 bg-white dark:bg-gray-900">
								{story.user.avatarUrl ? (
									<img
										src={story.user.avatarUrl}
										alt={story.user.name}
										className="h-14 w-14 rounded-full object-cover"
									/>
								) : (
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-bold text-primary-700 dark:from-primary-900/50 dark:to-primary-800/50 dark:text-primary-400">
										{story.user.name?.charAt(0).toUpperCase()}
									</div>
								)}
							</div>
						</div>
						<span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[64px] group-hover:text-primary-600 transition-colors">
							{isOwn ? "Của bạn" : story.user.name.split(" ").pop()}
						</span>
					</button>
				);
			})}

			{stories.length === 0 && (
				<p className="text-xs text-gray-400 dark:text-gray-500 self-center ml-2">
					Chưa có story nào. Hãy thêm story đầu tiên!
				</p>
			)}
		</div>
	);
}
