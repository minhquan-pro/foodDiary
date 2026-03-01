import { useState } from "react";
import { FiSearch, FiMessageSquare } from "react-icons/fi";

function formatTime(dateStr) {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now - date;
	const diffMin = Math.floor(diffMs / 60000);
	const diffHr = Math.floor(diffMs / 3600000);
	const diffDay = Math.floor(diffMs / 86400000);

	if (diffMin < 1) return "now";
	if (diffMin < 60) return `${diffMin}m`;
	if (diffHr < 24) return `${diffHr}h`;
	if (diffDay < 7) return `${diffDay}d`;

	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ConversationList({
	conversations,
	activeId,
	loading,
	currentUserId,
	isUserOnline,
	onSelect,
	compact,
}) {
	const [search, setSearch] = useState("");

	const filtered = conversations.filter((c) => c.otherUser?.name?.toLowerCase().includes(search.toLowerCase()));

	return (
		<>
			{/* Header */}
			{!compact && (
				<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<FiMessageSquare size={20} className="text-sky-400" />
						<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Messages</h2>
					</div>
				</div>
			)}

			{/* Search */}
			<div className="px-4 py-3">
				<div className="relative">
					<FiSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search conversations..."
						className="input pl-9 !py-2 !text-sm !rounded-xl"
					/>
				</div>
			</div>

			{/* Conversation List */}
			<div className="flex-1 overflow-y-auto">
				{loading ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-sky-400" />
					</div>
				) : filtered.length === 0 ? (
					<div className="px-4 py-12 text-center">
						<FiMessageSquare size={32} className="mx-auto mb-2 text-gray-200 dark:text-gray-600" />
						<p className="text-sm text-gray-400 dark:text-gray-500">
							{search ? "No conversations found" : "No messages yet"}
						</p>
						<p className="mt-1 text-xs text-gray-300 dark:text-gray-600">
							Visit a profile to start chatting
						</p>
					</div>
				) : (
					<div className="px-2">
						{filtered.map((conv) => {
							const isActive = conv.id === activeId;
							const otherUser = conv.otherUser;
							const online = otherUser && isUserOnline(otherUser.id);
							const lastMsg = conv.lastMessage;
							const isOwn = lastMsg?.sender?.id === currentUserId;

							return (
								<button
									key={conv.id}
									onClick={() => onSelect(conv.id)}
									className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150 mb-0.5 ${
										isActive
											? "bg-sky-50 dark:bg-sky-900/20"
											: "hover:bg-gray-50 dark:hover:bg-gray-700/50"
									}`}
								>
									{/* Avatar */}
									<div className="relative shrink-0">
										{otherUser?.avatarUrl ? (
											<img
												src={otherUser.avatarUrl}
												alt={otherUser.name}
												className="h-12 w-12 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-sm font-bold text-sky-600 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-400">
												{otherUser?.name?.charAt(0).toUpperCase() || "?"}
											</div>
										)}
										{/* Online indicator */}
										{online && (
											<span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
										)}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<p
												className={`text-sm font-semibold truncate ${
													conv.unreadCount > 0
														? "text-gray-900 dark:text-white"
														: "text-gray-700 dark:text-gray-200"
												}`}
											>
												{otherUser?.name || "Unknown"}
											</p>
											<span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 ml-2">
												{formatTime(lastMsg?.createdAt || conv.updatedAt)}
											</span>
										</div>
										<div className="flex items-center justify-between mt-0.5">
											<p
												className={`text-xs truncate ${
													conv.unreadCount > 0
														? "text-gray-600 font-medium dark:text-gray-300"
														: "text-gray-400 dark:text-gray-500"
												}`}
											>
												{lastMsg
													? `${isOwn ? "You: " : ""}${lastMsg.body}`
													: "Start a conversation"}
											</p>
											{conv.unreadCount > 0 && (
												<span className="ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sky-400 px-1.5 text-[10px] font-bold text-white">
													{conv.unreadCount}
												</span>
											)}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</>
	);
}
