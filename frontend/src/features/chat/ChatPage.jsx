import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useSocket } from "../../context/SocketContext.jsx";
import {
	fetchConversations,
	startConversation,
	fetchMessages,
	setActiveConversation,
	clearActiveConversation,
	addMessage,
	incrementUnread,
	clearConversationUnread,
} from "./chatSlice.js";
import ConversationList from "./ConversationList.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { FiMessageSquare, FiArrowLeft } from "react-icons/fi";

export default function ChatPage() {
	const dispatch = useDispatch();
	const [searchParams] = useSearchParams();
	const { socket, isUserOnline } = useSocket();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { conversations, activeConversationId, messages, loading, messagesLoading } = useSelector(
		(state) => state.chat,
	);
	const [showSidebar, setShowSidebar] = useState(true);
	const initRef = useRef(false);

	// Load conversations on mount
	useEffect(() => {
		dispatch(fetchConversations());
	}, [dispatch]);

	// Handle ?userId= param to start/open a conversation
	useEffect(() => {
		const targetUserId = searchParams.get("userId");
		if (targetUserId && !initRef.current) {
			initRef.current = true;
			dispatch(startConversation(targetUserId)).then((action) => {
				if (action.meta.requestStatus === "fulfilled") {
					setShowSidebar(false);
				}
			});
		}
	}, [searchParams, dispatch]);

	// Load messages when active conversation changes
	useEffect(() => {
		if (activeConversationId) {
			dispatch(fetchMessages({ conversationId: activeConversationId }));
			dispatch(clearConversationUnread(activeConversationId));

			// Join socket room
			socket?.emit("chat:join", activeConversationId);
			socket?.emit("chat:markRead", { conversationId: activeConversationId });
		}

		return () => {
			if (activeConversationId) {
				socket?.emit("chat:leave", activeConversationId);
			}
		};
	}, [activeConversationId, socket, dispatch]);

	// Listen for new messages via socket
	useEffect(() => {
		if (!socket) return;

		const handleNewMessage = ({ conversationId, message }) => {
			// Don't add our own messages (already added optimistically)
			if (message.sender.id === currentUser?.id) return;

			dispatch(addMessage({ conversationId, message }));

			if (conversationId !== activeConversationId) {
				dispatch(incrementUnread({ conversationId }));
			} else {
				// Mark as read if we're viewing this conversation
				socket.emit("chat:markRead", { conversationId });
			}
		};

		const handleConversationUpdated = ({ conversationId, lastMessage }) => {
			// Refresh conversations list if we get a message for an unknown conversation
			const exists = conversations.some((c) => c.id === conversationId);
			if (!exists) {
				dispatch(fetchConversations());
			}
		};

		socket.on("chat:newMessage", handleNewMessage);
		socket.on("chat:conversationUpdated", handleConversationUpdated);

		return () => {
			socket.off("chat:newMessage", handleNewMessage);
			socket.off("chat:conversationUpdated", handleConversationUpdated);
		};
	}, [socket, activeConversationId, currentUser, dispatch, conversations]);

	const handleSelectConversation = useCallback(
		(id) => {
			dispatch(setActiveConversation(id));
			setShowSidebar(false);
		},
		[dispatch],
	);

	const handleBack = useCallback(() => {
		dispatch(clearActiveConversation());
		setShowSidebar(true);
	}, [dispatch]);

	const activeConversation = conversations.find((c) => c.id === activeConversationId);
	const activeMessages = messages[activeConversationId] || [];

	return (
		<div className="mx-auto max-w-5xl px-4 pt-6">
			<div className="card-static overflow-hidden" style={{ height: "calc(100vh - 120px)" }}>
				<div className="flex h-full">
					{/* Sidebar - conversation list */}
					<div
						className={`${
							showSidebar ? "flex" : "hidden"
						} md:flex w-full md:w-80 lg:w-96 flex-col border-r border-gray-100 dark:border-gray-700`}
					>
						<ConversationList
							conversations={conversations}
							activeId={activeConversationId}
							loading={loading}
							currentUserId={currentUser?.id}
							isUserOnline={isUserOnline}
							onSelect={handleSelectConversation}
						/>
					</div>

					{/* Main chat area */}
					<div className={`${!showSidebar ? "flex" : "hidden"} md:flex flex-1 flex-col`}>
						{activeConversation ? (
							<ChatWindow
								conversation={activeConversation}
								messages={activeMessages}
								loading={messagesLoading}
								currentUser={currentUser}
								socket={socket}
								isUserOnline={isUserOnline}
								onBack={handleBack}
								onLoadMore={() => {
									if (activeMessages.length > 0) {
										dispatch(
											fetchMessages({
												conversationId: activeConversationId,
												cursor: activeMessages[0].createdAt,
											}),
										);
									}
								}}
							/>
						) : (
							<div className="flex flex-1 flex-col items-center justify-center text-gray-400 dark:text-gray-500">
								<div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 mb-4">
									<FiMessageSquare size={36} className="text-primary-500" />
								</div>
								<h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">
									Your messages
								</h3>
								<p className="text-sm">Select a conversation to start chatting</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
