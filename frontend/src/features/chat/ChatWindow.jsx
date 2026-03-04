import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addMessage, updateMessageReactions, deleteConversation, softDeleteMessage, markMessagesAsRead } from "./chatSlice.js";
import { FiArrowLeft, FiSend, FiMoreVertical, FiHeart, FiTrash2, FiUsers, FiCornerUpLeft, FiX } from "react-icons/fi";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";

function formatMessageTime(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDateSeparator(dateStr) {
	const date = new Date(dateStr);
	const now = new Date();
	const diffDays = Math.floor((now - date) / 86400000);
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "long" });
	return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function shouldShowDateSeparator(messages, index) {
	if (index === 0) return true;
	const curr = new Date(messages[index].createdAt).toDateString();
	const prev = new Date(messages[index - 1].createdAt).toDateString();
	return curr !== prev;
}

export default function ChatWindow({
	conversation,
	messages,
	loading,
	currentUser,
	socket,
	isUserOnline,
	onBack,
	onLoadMore,
}) {
	const dispatch = useDispatch();
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [typingUsers, setTypingUsers] = useState([]);
	const [menuOpen, setMenuOpen] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [replyingTo, setReplyingTo] = useState(null); // { id, body, sender }
	const [seenByOther, setSeenByOther] = useState(false);
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const prevMessagesLenRef = useRef(0);
	const menuRef = useRef(null);
	const inputRef = useRef(null);

	const isGroup = conversation.isGroup;
	const otherUser = conversation.otherUser;
	const members = conversation.members || [];
	const online = !isGroup && otherUser && isUserOnline(otherUser.id);

	const displayName = isGroup
		? conversation.name ||
			members.filter((m) => m.id !== currentUser.id).map((m) => m.name).join(", ") ||
			"Group Chat"
		: otherUser?.name || "Unknown";

	const displayAvatarUrl = isGroup ? null : otherUser?.avatarUrl;

	// Auto-scroll
	useEffect(() => {
		if (messages.length > prevMessagesLenRef.current) {
			const container = messagesContainerRef.current;
			if (container) {
				const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
				if (isNearBottom || messages.length - prevMessagesLenRef.current === 1) {
					messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
				}
			}
		}
		prevMessagesLenRef.current = messages.length;
	}, [messages.length]);

	useEffect(() => {
		if (!loading && messages.length > 0) {
			messagesEndRef.current?.scrollIntoView();
		}
	}, [loading, conversation.id]);

	// Socket listeners
	useEffect(() => {
		if (!socket) return;

		const handleTyping = ({ conversationId, userId }) => {
			if (conversationId === conversation.id && userId !== currentUser.id) {
				setIsTyping(true);
				if (isGroup) setTypingUsers((prev) => prev.includes(userId) ? prev : [...prev, userId]);
			}
		};

		const handleStopTyping = ({ conversationId, userId }) => {
			if (conversationId === conversation.id && userId !== currentUser.id) {
				if (isGroup) {
					setTypingUsers((prev) => {
						const next = prev.filter((id) => id !== userId);
						if (next.length === 0) setIsTyping(false);
						return next;
					});
				} else {
					setIsTyping(false);
				}
			}
		};

		const handleReactionUpdated = ({ conversationId, message }) => {
			if (conversationId === conversation.id) {
				dispatch(updateMessageReactions({ conversationId, message }));
			}
		};

		const handleMessageDeleted = ({ conversationId, messageId, message }) => {
			if (conversationId === conversation.id) {
				dispatch(softDeleteMessage({ conversationId, messageId, message }));
			}
		};

		const handleMessagesRead = ({ conversationId, readBy }) => {
			if (conversationId === conversation.id && readBy !== currentUser.id) {
				dispatch(markMessagesAsRead({ conversationId }));
				setSeenByOther(true);
			}
		};

		socket.on("chat:typing", handleTyping);
		socket.on("chat:stopTyping", handleStopTyping);
		socket.on("chat:messageReactionUpdated", handleReactionUpdated);
		socket.on("chat:messageDeleted", handleMessageDeleted);
		socket.on("chat:messagesRead", handleMessagesRead);

		return () => {
			socket.off("chat:typing", handleTyping);
			socket.off("chat:stopTyping", handleStopTyping);
			socket.off("chat:messageReactionUpdated", handleReactionUpdated);
			socket.off("chat:messageDeleted", handleMessageDeleted);
			socket.off("chat:messagesRead", handleMessagesRead);
		};
	}, [socket, conversation.id, currentUser.id, dispatch, isGroup]);

	// Reset seen status when conversation changes
	useEffect(() => {
		setSeenByOther(false);
		setReplyingTo(null);
	}, [conversation.id]);

	const handleInputChange = (e) => {
		setInput(e.target.value);
		if (socket) {
			socket.emit("chat:typing", { conversationId: conversation.id });
			clearTimeout(typingTimeoutRef.current);
			typingTimeoutRef.current = setTimeout(() => {
				socket.emit("chat:stopTyping", { conversationId: conversation.id });
			}, 2000);
		}
	};

	const handleSend = useCallback(() => {
		const body = input.trim();
		if (!body || !socket) return;

		const optimisticMessage = {
			id: `temp-${Date.now()}`,
			body,
			senderId: currentUser.id,
			sender: { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
			conversationId: conversation.id,
			createdAt: new Date().toISOString(),
			read: false,
			deleted: false,
			replyTo: replyingTo ? { id: replyingTo.id, body: replyingTo.body, sender: replyingTo.sender, deleted: replyingTo.deleted } : null,
		};

		dispatch(addMessage({ conversationId: conversation.id, message: optimisticMessage }));
		setInput("");
		setReplyingTo(null);
		setSeenByOther(false);

		socket.emit("chat:stopTyping", { conversationId: conversation.id });
		clearTimeout(typingTimeoutRef.current);

		socket.emit("chat:sendMessage", {
			conversationId: conversation.id,
			body,
			replyToId: replyingTo?.id || null,
		}, (response) => {
			if (response?.error) console.error("Failed to send message:", response.error);
		});
	}, [input, socket, currentUser, conversation.id, dispatch, replyingTo]);

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
		if (e.key === "Escape" && replyingTo) {
			setReplyingTo(null);
		}
	};

	const handleToggleReaction = (messageId) => {
		if (!socket) return;
		socket.emit("chat:toggleReaction", { conversationId: conversation.id, messageId, emoji: "❤️" });
	};

	const handleDeleteMessage = (messageId) => {
		if (!socket) return;
		socket.emit("chat:deleteMessage", { conversationId: conversation.id, messageId }, (response) => {
			if (response?.error) console.error("Delete message error:", response.error);
		});
	};

	const handleReply = (msg) => {
		setReplyingTo({ id: msg.id, body: msg.body, sender: msg.sender, deleted: msg.deleted });
		inputRef.current?.focus();
	};

	const handleScroll = () => {
		const container = messagesContainerRef.current;
		if (container && container.scrollTop === 0 && messages.length >= 30) {
			onLoadMore?.();
		}
	};

	useEffect(() => {
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
		};
		if (menuOpen) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [menuOpen]);

	const handleDeleteChat = () => {
		dispatch(deleteConversation(conversation.id));
		setShowDeleteModal(false);
		onBack?.();
	};

	// Find last sent-by-me message index for "Seen" indicator
	const lastMyMsgIdx = messages.reduceRight((found, m, i) => {
		if (found !== -1) return found;
		return (m.senderId === currentUser.id || m.sender?.id === currentUser.id) && !m.id?.toString().startsWith("temp-") ? i : -1;
	}, -1);

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
				<button
					onClick={onBack}
					className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700"
				>
					<FiArrowLeft size={20} />
				</button>

				{isGroup ? (
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-200 text-sm font-bold text-violet-600 dark:from-violet-900/50 dark:to-violet-800/50 dark:text-violet-400 shrink-0">
							<FiUsers size={18} />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">{displayName}</p>
							<p className="text-xs text-gray-400 dark:text-gray-500 truncate">
								{isTyping && typingUsers.length > 0 ? (
									<span className="text-sky-400 font-medium">
										{typingUsers.length === 1
											? `${members.find((m) => m.id === typingUsers[0])?.name || "Someone"} is typing...`
											: `${typingUsers.length} people are typing...`}
									</span>
								) : (
									`${members.length} members`
								)}
							</p>
						</div>
					</div>
				) : (
					<Link to={`/profile/${otherUser?.id}`} className="flex items-center gap-3 flex-1 min-w-0">
						<div className="relative shrink-0">
							{otherUser?.avatarUrl ? (
								<img src={otherUser.avatarUrl} alt={otherUser.name} className="h-10 w-10 rounded-full object-cover" />
							) : (
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-sm font-bold text-sky-600 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-400">
									{otherUser?.name?.charAt(0).toUpperCase() || "?"}
								</div>
							)}
							{online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />}
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
								{otherUser?.name || "Unknown"}
								<VerifiedBadge role={otherUser?.role} className="ml-1" />
							</p>
							<p className="text-xs text-gray-400 dark:text-gray-500">
								{isTyping ? <span className="text-sky-400 font-medium">typing...</span>
									: online ? <span className="text-green-500">Online</span>
									: "Offline"}
							</p>
						</div>
					</Link>
				)}

				{/* Three-dot menu */}
				<div className="relative" ref={menuRef}>
					<button
						onClick={() => setMenuOpen(!menuOpen)}
						className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
					>
						<FiMoreVertical size={18} />
					</button>
					{menuOpen && (
						<div className="absolute right-0 top-10 z-40 w-44 rounded-xl bg-white border border-gray-200 shadow-lg py-1 animate-fade-in dark:bg-gray-800 dark:border-gray-700">
							<button
								onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }}
								className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
							>
								<FiTrash2 size={15} />
								Delete chat
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Messages */}
			<div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
				{loading && messages.length === 0 ? (
					<div className="flex items-center justify-center py-12">
						<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-sky-400" />
					</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-gray-400">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
							{isGroup ? (
								<FiUsers size={28} className="text-violet-400" />
							) : displayAvatarUrl ? (
								<img src={displayAvatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
							) : (
								<span className="text-2xl font-bold text-sky-400">{displayName.charAt(0).toUpperCase()}</span>
							)}
						</div>
						<p className="text-sm font-medium text-gray-600 dark:text-gray-300">{displayName}</p>
						<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
							{isGroup ? `${members.length} members — send the first message!` : "Say hi to start the conversation!"}
						</p>
					</div>
				) : (
					<>
						{messages.map((msg, idx) => {
							const isMine = msg.senderId === currentUser.id || msg.sender?.id === currentUser.id;
							const showDate = shouldShowDateSeparator(messages, idx);
							const showAvatar =
								!isMine &&
								(idx === messages.length - 1 ||
									messages[idx + 1]?.senderId !== msg.senderId ||
									messages[idx + 1]?.sender?.id !== msg.sender?.id);
							const senderName = msg.sender?.name || "Unknown";
							const showSenderName =
								isGroup && !isMine &&
								(idx === 0 || showDate ||
									(messages[idx - 1]?.senderId !== msg.senderId &&
										messages[idx - 1]?.sender?.id !== msg.sender?.id));
							const isLastMyMsg = idx === lastMyMsgIdx;

							return (
								<div key={msg.id}>
									{showDate && (
										<div className="flex items-center justify-center py-3">
											<span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
												{formatDateSeparator(msg.createdAt)}
											</span>
										</div>
									)}
									{showSenderName && (
										<p className="ml-9 mt-2 mb-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
											{senderName}
										</p>
									)}

									<div className={`flex items-end gap-2 mb-0.5 group/msg ${isMine ? "justify-end" : "justify-start"}`}>
										{/* Other user avatar */}
										{!isMine && (
											<div className="w-7 shrink-0">
												{showAvatar && (
													msg.sender?.avatarUrl ? (
														<img src={msg.sender.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
													) : (
														<div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-[10px] font-bold text-sky-600 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-400">
															{senderName.charAt(0).toUpperCase()}
														</div>
													)
												)}
											</div>
										)}

										{/* Reply button (shows on hover) — left for mine, right for theirs */}
										{!msg.deleted && (
											<button
												onClick={() => handleReply(msg)}
												className={`opacity-0 group-hover/msg:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-sky-500 shrink-0 ${isMine ? "order-first" : "order-last"}`}
												title="Reply"
											>
												<FiCornerUpLeft size={13} />
											</button>
										)}

										{/* Message bubble */}
										<div className="relative max-w-[70%]">
											<div
												className={`group relative rounded-2xl px-3.5 py-2 ${
													msg.deleted
														? "bg-gray-100 dark:bg-gray-700/50 italic"
														: isMine
															? "bg-sky-400 text-white rounded-br-md"
															: "bg-gray-100 text-gray-800 rounded-bl-md dark:bg-gray-700 dark:text-gray-100"
												}`}
											>
												{/* Reply quote */}
												{msg.replyTo && !msg.deleted && (
													<div className={`mb-2 rounded-lg px-2.5 py-1.5 text-xs border-l-2 ${
														isMine
															? "bg-sky-500/30 border-white/60 text-white/80"
															: "bg-gray-200/60 border-sky-400 text-gray-500 dark:bg-gray-600/40 dark:text-gray-400"
													}`}>
														<p className="font-semibold mb-0.5">
															{msg.replyTo.sender?.name || "Unknown"}
														</p>
														<p className="truncate">
															{msg.replyTo.deleted ? "Message deleted" : msg.replyTo.body}
														</p>
													</div>
												)}

												{/* Message body */}
												{msg.deleted ? (
													<p className="text-sm text-gray-400 dark:text-gray-500">Message deleted</p>
												) : (
													<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
												)}

												<p className={`text-[10px] mt-0.5 text-right ${isMine ? "text-white/60" : "text-gray-400 dark:text-gray-500"}`}>
													{formatMessageTime(msg.createdAt)}
												</p>

												{/* Heart reaction button (hover) */}
												{!msg.deleted && !msg.id?.toString().startsWith("temp-") && (
													<button
														onClick={() => handleToggleReaction(msg.id)}
														className={`absolute ${isMine ? "-left-8" : "-right-8"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600`}
														title="React with ❤️"
													>
														<FiHeart
															size={14}
															className={msg.reactions?.some((r) => r.userId === currentUser.id || r.user?.id === currentUser.id)
																? "fill-red-500 text-red-500"
																: "text-gray-400 hover:text-red-400"}
														/>
													</button>
												)}

												{/* Delete own message button (hover) */}
												{isMine && !msg.deleted && !msg.id?.toString().startsWith("temp-") && (
													<button
														onClick={() => handleDeleteMessage(msg.id)}
														className="absolute -left-8 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
														title="Delete message"
													>
														<FiTrash2 size={12} className="text-gray-300 hover:text-red-500" />
													</button>
												)}
											</div>

											{/* Reaction badges */}
											{msg.reactions && msg.reactions.length > 0 && (
												<div className={`flex ${isMine ? "justify-end" : "justify-start"} -mt-1.5 ${isMine ? "mr-1" : "ml-1"}`}>
													<div className="flex items-center gap-0.5 rounded-full bg-white border border-gray-100 shadow-sm px-1.5 py-0.5 dark:bg-gray-800 dark:border-gray-600">
														<span className="text-xs">❤️</span>
														{msg.reactions.length > 1 && (
															<span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{msg.reactions.length}</span>
														)}
													</div>
												</div>
											)}

											{/* Seen indicator (only for last sent message in 1-on-1) */}
											{isMine && !isGroup && isLastMyMsg && seenByOther && !msg.id?.toString().startsWith("temp-") && (
												<p className="text-[10px] text-gray-400 dark:text-gray-500 text-right mt-0.5 mr-1">
													Seen
												</p>
											)}
										</div>
									</div>
								</div>
							);
						})}

						{/* Typing indicator */}
						{isTyping && (
							<div className="flex items-end gap-2 mb-0.5">
								<div className="w-7 shrink-0">
									{!isGroup && otherUser?.avatarUrl && (
										<img src={otherUser.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
									)}
								</div>
								<div>
									{isGroup && typingUsers.length > 0 && (
										<p className="ml-1 mb-0.5 text-[10px] font-medium text-sky-400">
											{typingUsers.length === 1
												? `${members.find((m) => m.id === typingUsers[0])?.name || "Someone"}`
												: `${typingUsers.length} people`}
										</p>
									)}
									<div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 dark:bg-gray-700">
										<div className="flex gap-1">
											<span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce dark:bg-gray-500" style={{ animationDelay: "0ms" }} />
											<span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce dark:bg-gray-500" style={{ animationDelay: "150ms" }} />
											<span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce dark:bg-gray-500" style={{ animationDelay: "300ms" }} />
										</div>
									</div>
								</div>
							</div>
						)}
					</>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Reply preview bar */}
			{replyingTo && (
				<div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
					<FiCornerUpLeft size={15} className="text-sky-400 shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-xs font-semibold text-sky-500 dark:text-sky-400">{replyingTo.sender?.name || "Unknown"}</p>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
							{replyingTo.deleted ? "Message deleted" : replyingTo.body}
						</p>
					</div>
					<button
						onClick={() => setReplyingTo(null)}
						className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
					>
						<FiX size={15} />
					</button>
				</div>
			)}

			{/* Input area */}
			<div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
				<div className="flex items-end gap-2">
					<div className="flex-1 relative">
						<textarea
							ref={inputRef}
							value={input}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							placeholder="Type a message..."
							rows={1}
							className="input !rounded-2xl !py-2.5 !pr-12 resize-none max-h-32"
							style={{ minHeight: "42px" }}
							onInput={(e) => {
								e.target.style.height = "auto";
								e.target.style.height = Math.min(e.target.scrollHeight, 128) + "px";
							}}
						/>
					</div>
					<button
						onClick={handleSend}
						disabled={!input.trim()}
						className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-blue-400 text-white shadow-sm transition-all duration-200 hover:from-sky-500 hover:to-blue-500 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
					>
						<FiSend size={18} className="translate-x-px" />
					</button>
				</div>
			</div>

			{/* Delete Conversation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
					<div className="relative w-full max-w-xs rounded-2xl bg-white shadow-xl animate-slide-up dark:bg-gray-800">
						<div className="px-6 py-5 text-center">
							<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
								<FiTrash2 size={22} className="text-red-500" />
							</div>
							<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Delete conversation?</h3>
							<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
								This will permanently delete all messages. This action cannot be undone.
							</p>
						</div>
						<div className="flex items-center gap-2.5 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteChat}
								className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}