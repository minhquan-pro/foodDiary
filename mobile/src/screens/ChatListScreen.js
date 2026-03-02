import React, { useEffect, useState, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Image,
	StyleSheet,
	RefreshControl,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversations, deleteConversation, fetchUnreadCount } from "../features/chat/chatSlice";
import { useSocket } from "../context/SocketContext";
import { getImageUrl } from "../lib/api";

function timeAgo(dateStr) {
	if (!dateStr) return "";
	const now = new Date();
	const date = new Date(dateStr);
	const seconds = Math.floor((now - date) / 1000);
	if (seconds < 60) return "now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

function getDisplayName(conv, currentUserId) {
	if (conv.isGroup) return conv.name || "Group Chat";
	const other = conv.members?.find((m) => m.user?.id !== currentUserId)?.user;
	return other?.name || "Unknown";
}

function getDisplayAvatar(conv, currentUserId) {
	if (conv.isGroup) return null;
	const other = conv.members?.find((m) => m.user?.id !== currentUserId)?.user;
	return other?.avatarUrl || null;
}

function getDisplayInitial(conv, currentUserId) {
	const name = getDisplayName(conv, currentUserId);
	return name.charAt(0).toUpperCase();
}

export default function ChatListScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { conversations, loading } = useSelector((state) => state.chat);
	const { onlineUsers } = useSocket();
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		dispatch(fetchConversations());
		dispatch(fetchUnreadCount());
	}, []);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		dispatch(fetchConversations()).finally(() => setRefreshing(false));
	}, []);

	const handleDelete = (convId, convName) => {
		Alert.alert("Delete Conversation", `Delete chat with ${convName}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => dispatch(deleteConversation(convId)),
			},
		]);
	};

	const renderConversation = ({ item: conv }) => {
		const displayName = getDisplayName(conv, currentUser?.id);
		const avatarUrl = getDisplayAvatar(conv, currentUser?.id);
		const initial = getDisplayInitial(conv, currentUser?.id);
		const lastMsg = conv.lastMessage;
		const hasUnread = (conv.unreadCount || 0) > 0;

		// Check if other user is online (for 1-on-1)
		const otherUser = conv.members?.find((m) => m.user?.id !== currentUser?.id)?.user;
		const isOnline = otherUser && onlineUsers?.has?.(otherUser.id);

		return (
			<TouchableOpacity
				style={[styles.convItem, hasUnread && styles.convItemUnread]}
				onPress={() => navigation.navigate("ChatDetail", { conversationId: conv.id })}
				onLongPress={() => handleDelete(conv.id, displayName)}
			>
				{/* Avatar */}
				<View style={styles.avatarContainer}>
					{avatarUrl ? (
						<Image source={{ uri: getImageUrl(avatarUrl) }} style={styles.avatar} />
					) : (
						<View style={[styles.avatarPlaceholder, conv.isGroup && styles.groupAvatarPlaceholder]}>
							<Text style={styles.avatarText}>{conv.isGroup ? "👥" : initial}</Text>
						</View>
					)}
					{isOnline && <View style={styles.onlineDot} />}
				</View>

				{/* Content */}
				<View style={styles.convContent}>
					<View style={styles.convTopRow}>
						<Text style={[styles.convName, hasUnread && styles.convNameUnread]} numberOfLines={1}>
							{displayName}
						</Text>
						<Text style={styles.convTime}>{timeAgo(conv.updatedAt)}</Text>
					</View>
					<View style={styles.convBottomRow}>
						<Text style={[styles.convLastMsg, hasUnread && styles.convLastMsgUnread]} numberOfLines={1}>
							{lastMsg
								? conv.isGroup
									? `${lastMsg.sender?.name}: ${lastMsg.body}`
									: lastMsg.body
								: "No messages yet"}
						</Text>
						{hasUnread && (
							<View style={styles.unreadBadge}>
								<Text style={styles.unreadBadgeText}>
									{conv.unreadCount > 99 ? "99+" : conv.unreadCount}
								</Text>
							</View>
						)}
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<Text style={styles.headerTitle}>Messages</Text>
			</View>

			{loading && conversations.length === 0 ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#F97316" />
				</View>
			) : (
				<FlatList
					data={conversations}
					keyExtractor={(item) => String(item.id)}
					renderItem={renderConversation}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Text style={styles.emptyIcon}>💬</Text>
							<Text style={styles.emptyText}>No conversations yet</Text>
							<Text style={styles.emptySubtext}>Visit someone's profile to start chatting</Text>
						</View>
					}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={["#F97316"]}
							tintColor="#F97316"
						/>
					}
					contentContainerStyle={styles.listContent}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		paddingHorizontal: 16,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1F2937",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	listContent: {
		flexGrow: 1,
	},
	convItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 14,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	convItemUnread: {
		backgroundColor: "#FFF7ED",
	},
	avatarContainer: {
		position: "relative",
		marginRight: 12,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	avatarPlaceholder: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#FED7AA",
		justifyContent: "center",
		alignItems: "center",
	},
	groupAvatarPlaceholder: {
		backgroundColor: "#DDD6FE",
	},
	avatarText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#EA580C",
	},
	onlineDot: {
		position: "absolute",
		bottom: 1,
		right: 1,
		width: 14,
		height: 14,
		borderRadius: 7,
		backgroundColor: "#22C55E",
		borderWidth: 2,
		borderColor: "#FFFFFF",
	},
	convContent: {
		flex: 1,
	},
	convTopRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	convName: {
		fontSize: 15,
		fontWeight: "500",
		color: "#1F2937",
		flex: 1,
		marginRight: 8,
	},
	convNameUnread: {
		fontWeight: "700",
	},
	convTime: {
		fontSize: 12,
		color: "#9CA3AF",
	},
	convBottomRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	convLastMsg: {
		fontSize: 13,
		color: "#6B7280",
		flex: 1,
		marginRight: 8,
	},
	convLastMsgUnread: {
		color: "#1F2937",
		fontWeight: "600",
	},
	unreadBadge: {
		backgroundColor: "#F97316",
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 6,
	},
	unreadBadgeText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "700",
	},
	empty: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingTop: 80,
	},
	emptyIcon: {
		fontSize: 48,
		marginBottom: 16,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#374151",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 4,
	},
});
