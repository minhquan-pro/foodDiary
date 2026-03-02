import { useState } from "react";
import { FiSearch, FiMessageSquare, FiUsers } from "react-icons/fi";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";

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

function getConversationDisplayName(conv, currentUserId) {
	if (conv.isGroup) {
		return (
			conv.name ||
			conv.members
				?.filter((m) => m.id !== currentUserId)
				.map((m) => m.name)
				.join(", ") ||
			"Group Chat"
		);
	}
	return conv.otherUser?.name || "Unknown";
}

function getConversationAvatar(conv, currentUserId) {
	if (conv.isGroup) {
		return null; // Groups use icon avatar
	}
	return conv.otherUser?.avatarUrl || null;
}

function getConversationAvatarLetter(conv, currentUserId) {
	const name = getConversationDisplayName(conv, currentUserId);
	return name.charAt(0).toUpperCase();
}

export default function ConversationList({
	conversations,
	activeId,
	loading,
	currentUserId,
	isUserOnline,
	onSelect,
	onCreateGroup,
	compact,
}) {
	const [search, setSearch] = useState("");

	const filtered = conversations.filter((c) => {
		const name = getConversationDisplayName(c, currentUserId);
		return name.toLowerCase().includes(search.toLowerCase());
	});

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

			{/* Search + New Group button */}
			<div className="px-4 py-3 space-y-2">
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
				{onCreateGroup && (
					<button
						onClick={onCreateGroup}
						className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 hover:border-sky-400 hover:text-sky-500 hover:bg-sky-50/50 transition-colors dark:border-gray-600 dark:text-gray-400 dark:hover:border-sky-500 dark:hover:text-sky-400 dark:hover:bg-sky-900/20"
					>
						<FiUsers size={15} />
						New Group Chat
					</button>
				)}
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
							const isGroup = conv.isGroup;
							const otherUser = conv.otherUser;
							const displayName = getConversationDisplayName(conv, currentUserId);
							const avatarUrl = getConversationAvatar(conv, currentUserId);
							const avatarLetter = getConversationAvatarLetter(conv, currentUserId);
							const online = !isGroup && otherUser && isUserOnline(otherUser.id);
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
										{isGroup ? (
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-sm font-bold text-violet-600 dark:from-violet-900/50 dark:to-violet-800/50 dark:text-violet-400">
												<FiUsers size={20} />
											</div>
										) : avatarUrl ? (
											<img
												src={avatarUrl}
												alt={displayName}
												className="h-12 w-12 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-sm font-bold text-sky-600 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-400">
												{avatarLetter}
											</div>
										)}
										{/* Online indicator — only for 1-on-1 */}
										{online && (
											<span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
										)}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-1">
												<p
													className={`text-sm font-semibold truncate ${
														conv.unreadCount > 0
															? "text-gray-900 dark:text-white"
															: "text-gray-700 dark:text-gray-200"
													}`}
												>
													{displayName}
												</p>
												{!isGroup && <VerifiedBadge role={otherUser?.role} size={14} />}
												{isGroup && (
													<span className="ml-1 text-[10px] text-gray-400 dark:text-gray-500">
														{conv.members?.length || 0}
													</span>
												)}
											</div>
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
													? `${isOwn ? "You: " : isGroup && lastMsg.sender ? `${lastMsg.sender.name}: ` : ""}${lastMsg.body}`
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
