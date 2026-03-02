import React, { useEffect, useState, useRef, useCallback } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	FlatList,
	Image,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchMessages,
	setActiveConversation,
	clearActiveConversation,
	clearConversationUnread,
} from "../features/chat/chatSlice";
import { useSocket } from "../context/SocketContext";
import { getImageUrl } from "../lib/api";

function formatTime(dateStr) {
	const date = new Date(dateStr);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr) {
	const date = new Date(dateStr);
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return "Today";
	if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
	return date.toLocaleDateString();
}

export default function ChatDetailScreen({ route, navigation }) {
	const { conversationId } = route.params;
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { socket } = useSocket();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { messages: allMessages, conversations, messagesLoading } = useSelector((state) => state.chat);

	const messages = allMessages[conversationId] || [];
	const conversation = conversations.find((c) => c.id === conversationId);
	const flatListRef = useRef(null);

	const [text, setText] = useState("");
	const [typing, setTyping] = useState(false);
	const [typingUsers, setTypingUsers] = useState([]);
	const typingTimeout = useRef(null);

	// Get display info
	const isGroup = conversation?.isGroup;
	const displayName = isGroup
		? conversation?.name || "Group Chat"
		: conversation?.members?.find((m) => m.user?.id !== currentUser?.id)?.user?.name || "Chat";

	useEffect(() => {
		dispatch(setActiveConversation(conversationId));
		dispatch(fetchMessages({ conversationId }));
		dispatch(clearConversationUnread(conversationId));

		if (socket) {
			socket.emit("chat:join", conversationId);
			socket.emit("chat:markRead", conversationId);
		}

		return () => {
			dispatch(clearActiveConversation());
			if (socket) {
				socket.emit("chat:leave", conversationId);
			}
		};
	}, [conversationId]);

	// Listen for typing events
	useEffect(() => {
		if (!socket) return;

		const handleTyping = ({ userId, userName }) => {
			if (userId === currentUser?.id) return;
			setTypingUsers((prev) => {
				if (prev.find((u) => u.userId === userId)) return prev;
				return [...prev, { userId, userName }];
			});
		};

		const handleStopTyping = ({ userId }) => {
			setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
		};

		socket.on("chat:typing", handleTyping);
		socket.on("chat:stopTyping", handleStopTyping);

		return () => {
			socket.off("chat:typing", handleTyping);
			socket.off("chat:stopTyping", handleStopTyping);
		};
	}, [socket, currentUser?.id]);

	const handleSend = () => {
		if (!text.trim() || !socket) return;
		socket.emit("chat:sendMessage", {
			conversationId,
			body: text.trim(),
		});
		setText("");
		handleStopTyping();
	};

	const handleTextChange = (value) => {
		setText(value);
		if (!socket) return;

		if (!typing) {
			setTyping(true);
			socket.emit("chat:typing", conversationId);
		}

		clearTimeout(typingTimeout.current);
		typingTimeout.current = setTimeout(() => {
			handleStopTyping();
		}, 2000);
	};

	const handleStopTyping = () => {
		setTyping(false);
		if (socket) {
			socket.emit("chat:stopTyping", conversationId);
		}
	};

	const handleReaction = (messageId, emoji) => {
		if (socket) {
			socket.emit("chat:toggleReaction", { messageId, emoji });
		}
	};

	// Group messages by date
	const sortedMessages = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

	const renderMessage = ({ item: msg }) => {
		const isOwn = msg.senderId === currentUser?.id;
		const sender = msg.sender;

		return (
			<View style={[styles.messageBubbleContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
				{/* Show sender avatar for group chats */}
				{!isOwn && isGroup && (
					<View style={styles.senderAvatarContainer}>
						{sender?.avatarUrl ? (
							<Image source={{ uri: getImageUrl(sender.avatarUrl) }} style={styles.senderAvatar} />
						) : (
							<View style={styles.senderAvatarPlaceholder}>
								<Text style={styles.senderAvatarText}>{sender?.name?.charAt(0).toUpperCase()}</Text>
							</View>
						)}
					</View>
				)}

				<View style={styles.bubbleWrapper}>
					{/* Show sender name for group chats */}
					{!isOwn && isGroup && <Text style={styles.senderName}>{sender?.name}</Text>}
					<View style={[styles.messageBubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
						<Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
							{msg.body}
						</Text>
					</View>
					<Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
						{formatTime(msg.createdAt)}
					</Text>

					{/* Reactions */}
					{msg.reactions?.length > 0 && (
						<View style={styles.reactionsRow}>
							{msg.reactions.map((r, i) => (
								<Text key={i} style={styles.reaction}>
									{r.emoji}
								</Text>
							))}
						</View>
					)}
				</View>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={0}
		>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backBtn}>← </Text>
				</TouchableOpacity>
				<View style={styles.headerInfo}>
					<Text style={styles.headerName} numberOfLines={1}>
						{displayName}
					</Text>
					{isGroup && <Text style={styles.headerSubtitle}>{conversation?.members?.length || 0} members</Text>}
				</View>
			</View>

			{/* Messages */}
			{messagesLoading && messages.length === 0 ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#F97316" />
				</View>
			) : (
				<FlatList
					ref={flatListRef}
					data={sortedMessages}
					keyExtractor={(item) => String(item.id)}
					renderItem={renderMessage}
					contentContainerStyle={styles.messagesList}
					inverted={false}
					onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
					onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
				/>
			)}

			{/* Typing indicator */}
			{typingUsers.length > 0 && (
				<View style={styles.typingContainer}>
					<Text style={styles.typingText}>
						{typingUsers.map((u) => u.userName).join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
						typing...
					</Text>
				</View>
			)}

			{/* Input */}
			<View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
				<TextInput
					style={styles.input}
					placeholder="Type a message..."
					placeholderTextColor="#9CA3AF"
					value={text}
					onChangeText={handleTextChange}
					multiline
					maxLength={2000}
				/>
				<TouchableOpacity
					style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
					onPress={handleSend}
					disabled={!text.trim()}
				>
					<Text style={styles.sendBtnText}>Send</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	backBtn: {
		fontSize: 18,
		color: "#F97316",
		fontWeight: "600",
		marginRight: 8,
	},
	headerInfo: {
		flex: 1,
	},
	headerName: {
		fontSize: 17,
		fontWeight: "700",
		color: "#1F2937",
	},
	headerSubtitle: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	messagesList: {
		paddingHorizontal: 12,
		paddingVertical: 16,
		flexGrow: 1,
	},
	messageBubbleContainer: {
		flexDirection: "row",
		marginBottom: 8,
		maxWidth: "80%",
	},
	ownMessage: {
		alignSelf: "flex-end",
	},
	otherMessage: {
		alignSelf: "flex-start",
	},
	senderAvatarContainer: {
		marginRight: 8,
		alignSelf: "flex-end",
	},
	senderAvatar: {
		width: 28,
		height: 28,
		borderRadius: 14,
	},
	senderAvatarPlaceholder: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
	},
	senderAvatarText: {
		fontSize: 10,
		fontWeight: "700",
		color: "#6B7280",
	},
	bubbleWrapper: {
		maxWidth: "100%",
	},
	senderName: {
		fontSize: 11,
		fontWeight: "600",
		color: "#6B7280",
		marginBottom: 2,
		marginLeft: 4,
	},
	messageBubble: {
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	ownBubble: {
		backgroundColor: "#F97316",
		borderBottomRightRadius: 4,
	},
	otherBubble: {
		backgroundColor: "#FFFFFF",
		borderBottomLeftRadius: 4,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
	},
	ownMessageText: {
		color: "#FFFFFF",
	},
	otherMessageText: {
		color: "#1F2937",
	},
	messageTime: {
		fontSize: 10,
		marginTop: 4,
		marginHorizontal: 4,
	},
	ownTime: {
		color: "#9CA3AF",
		textAlign: "right",
	},
	otherTime: {
		color: "#9CA3AF",
		textAlign: "left",
	},
	reactionsRow: {
		flexDirection: "row",
		gap: 2,
		marginTop: 2,
		marginLeft: 4,
	},
	reaction: {
		fontSize: 14,
	},
	typingContainer: {
		paddingHorizontal: 20,
		paddingVertical: 6,
	},
	typingText: {
		fontSize: 12,
		color: "#6B7280",
		fontStyle: "italic",
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
		paddingHorizontal: 12,
		paddingTop: 8,
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
	},
	input: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 15,
		color: "#1F2937",
		maxHeight: 100,
	},
	sendBtn: {
		backgroundColor: "#F97316",
		borderRadius: 20,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	sendBtnDisabled: {
		opacity: 0.5,
	},
	sendBtnText: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 14,
	},
});
