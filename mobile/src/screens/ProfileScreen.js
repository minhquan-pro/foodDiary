import React, { useEffect, useCallback, useState } from "react";
import {
	View,
	Text,
	Image,
	TouchableOpacity,
	FlatList,
	StyleSheet,
	RefreshControl,
	ActivityIndicator,
	Alert,
	Modal,
	Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchProfile,
	fetchUserPosts,
	followUser,
	unfollowUser,
	blockUser,
	unblockUser,
	clearProfile,
} from "../features/profile/profileSlice";
import { logout } from "../features/auth/authSlice";
import { resetChat } from "../features/chat/chatSlice";
import { resetNotifications } from "../features/notifications/notificationsSlice";
import { startConversation } from "../features/chat/chatSlice";
import PostCard from "../components/PostCard";
import VerifiedBadge from "../components/VerifiedBadge";
import Toast from "react-native-toast-message";
import { getImageUrl } from "../lib/api";
import { useTheme } from "../context/ThemeContext";

export default function ProfileScreen({ route, navigation }) {
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { colors, isDark, toggleTheme } = useTheme();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { profile, posts, postsPagination, isFollowing, isBlocked, loading, postsLoading } = useSelector(
		(state) => state.profile,
	);

	// If userId is passed via route, show that user's profile. Otherwise show own profile.
	const userId = route.params?.userId || currentUser?.id;
	const isOwnProfile = userId === currentUser?.id;

	const [refreshing, setRefreshing] = useState(false);
	const [avatarModalVisible, setAvatarModalVisible] = useState(false);

	useEffect(() => {
		if (userId) {
			dispatch(fetchProfile(userId));
			dispatch(fetchUserPosts({ userId, page: 1 }));
		}
		return () => {
			dispatch(clearProfile());
		};
	}, [userId]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		Promise.all([dispatch(fetchProfile(userId)), dispatch(fetchUserPosts({ userId, page: 1 }))]).finally(() =>
			setRefreshing(false),
		);
	}, [userId]);

	const loadMorePosts = () => {
		if (postsLoading || !postsPagination?.hasMore) return;
		dispatch(fetchUserPosts({ userId, page: (postsPagination?.page || 1) + 1 }));
	};

	const handleFollow = () => {
		if (isFollowing) {
			dispatch(unfollowUser(userId));
			Toast.show({ type: "success", text1: `Unfollowed ${profile?.name}` });
		} else {
			dispatch(followUser(userId));
			Toast.show({ type: "success", text1: `Followed ${profile?.name}` });
		}
	};

	const handleBlock = () => {
		if (isBlocked) {
			dispatch(unblockUser(userId));
			Toast.show({ type: "success", text1: "User unblocked" });
		} else {
			Alert.alert("Block User", `Block ${profile?.name}?`, [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Block",
					style: "destructive",
					onPress: () => {
						dispatch(blockUser(userId));
						Toast.show({ type: "success", text1: "User blocked" });
					},
				},
			]);
		}
	};

	const handleMessage = async () => {
		try {
			const result = await dispatch(startConversation(userId)).unwrap();
			navigation.navigate("Chat", {
				screen: "ChatDetail",
				params: { conversationId: result.id },
			});
		} catch (err) {
			Toast.show({ type: "error", text1: "Could not start conversation" });
		}
	};

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: () => {
					dispatch(resetChat());
					dispatch(resetNotifications());
					dispatch(logout());
				},
			},
		]);
	};

	const renderHeader = () => (
		<View style={[styles.profileHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
			{/* Back button for non-own profiles */}
			{!isOwnProfile && (
				<TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => navigation.goBack()}>
					<Text style={styles.backBtnText}>← Back</Text>
				</TouchableOpacity>
			)}

			{/* Avatar and stats */}
			<View style={[styles.avatarSection, { paddingTop: isOwnProfile ? insets.top + 16 : insets.top + 48 }]}>
				{profile?.avatarUrl ? (
					<TouchableOpacity activeOpacity={0.9} onPress={() => setAvatarModalVisible(true)}>
						<Image
							source={{ uri: getImageUrl(profile.avatarUrl) }}
							style={[styles.avatar, { borderColor: colors.primary }]}
						/>
					</TouchableOpacity>
				) : (
					<View
						style={[
							styles.avatarPlaceholder,
							{ backgroundColor: colors.primaryLight, borderColor: colors.primary },
						]}
					>
						<Text style={[styles.avatarText, { color: colors.primary }]}>
							{profile?.name?.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}
				<View style={styles.nameRow}>
					<Text style={[styles.name, { color: colors.text }]}>{profile?.name}</Text>
					<VerifiedBadge role={profile?.role} />
				</View>
				{profile?.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>}
			</View>

			{/* Avatar Lightbox Modal */}
			{profile?.avatarUrl && (
				<Modal
					visible={avatarModalVisible}
					transparent={true}
					animationType="fade"
					onRequestClose={() => setAvatarModalVisible(false)}
				>
					<TouchableOpacity
						style={styles.lightboxOverlay}
						activeOpacity={1}
						onPress={() => setAvatarModalVisible(false)}
					>
						<Image
							source={{ uri: getImageUrl(profile.avatarUrl) }}
							style={styles.lightboxImage}
							resizeMode="contain"
						/>
						<TouchableOpacity style={styles.lightboxClose} onPress={() => setAvatarModalVisible(false)}>
							<Text style={styles.lightboxCloseText}>✕</Text>
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>
			)}

			{/* Stats */}
			<View style={[styles.stats, { borderTopColor: colors.inputBg, borderBottomColor: colors.inputBg }]}>
				<View style={styles.stat}>
					<Text style={[styles.statNumber, { color: colors.text }]}>{profile?._count?.posts || 0}</Text>
					<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
				</View>
				<View style={styles.stat}>
					<Text style={[styles.statNumber, { color: colors.text }]}>{profile?._count?.followers || 0}</Text>
					<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
				</View>
				<View style={styles.stat}>
					<Text style={[styles.statNumber, { color: colors.text }]}>{profile?._count?.following || 0}</Text>
					<Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
				</View>
			</View>

			{/* Action buttons */}
			<View style={styles.actionRow}>
				{isOwnProfile ? (
					<>
						<TouchableOpacity
							style={[styles.editBtn, { backgroundColor: colors.inputBg }]}
							onPress={() => navigation.navigate("EditProfile")}
						>
							<Text style={[styles.editBtnText, { color: colors.text }]}>Edit Profile</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.themeBtn, { backgroundColor: isDark ? colors.inputBg : colors.inputBg }]}
							onPress={toggleTheme}
						>
							<Text style={styles.themeBtnText}>{isDark ? "☀️" : "🌙"}</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.logoutBtn, { borderColor: "#EF4444" }]} onPress={handleLogout}>
							<Text style={[styles.logoutBtnText, { color: "#EF4444" }]}>Logout</Text>
						</TouchableOpacity>
					</>
				) : (
					<>
						<TouchableOpacity
							style={[
								styles.followBtn,
								{ backgroundColor: isFollowing ? colors.inputBg : colors.primary },
							]}
							onPress={handleFollow}
						>
							<Text style={[styles.followBtnText, { color: isFollowing ? colors.text : colors.card }]}>
								{isFollowing ? "Following" : "Follow"}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.messageBtn, { backgroundColor: colors.primaryLight }]}
							onPress={handleMessage}
						>
							<Text style={[styles.messageBtnText, { color: colors.primary }]}>Message</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.blockBtn, { borderColor: colors.border }]}
							onPress={handleBlock}
						>
							<Text style={[styles.blockBtnText, { color: "#EF4444" }]}>
								{isBlocked ? "Unblock" : "Block"}
							</Text>
						</TouchableOpacity>
					</>
				)}
			</View>

			<Text style={[styles.postsTitle, { color: colors.text }]}>Posts</Text>
		</View>
	);

	if (loading && !profile) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.surface }]}>
			<FlatList
				data={posts}
				keyExtractor={(item) => String(item.id)}
				renderItem={({ item }) => (
					<PostCard
						post={item}
						onPress={() => {
							const targetScreen = isOwnProfile ? "ProfilePostDetail" : "PostDetail";
							navigation.navigate(targetScreen, { postId: item.id });
						}}
						onUserPress={(uid) => navigation.push("UserProfile", { userId: uid })}
					/>
				)}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={
					!postsLoading ? (
						<View style={styles.empty}>
							<Text style={[styles.emptyText, { color: colors.textMuted }]}>No posts yet</Text>
						</View>
					) : null
				}
				ListFooterComponent={
					postsLoading ? (
						<ActivityIndicator style={styles.footer} size="small" color={colors.primary} />
					) : null
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[colors.primary]}
						tintColor={colors.primary}
					/>
				}
				onEndReached={loadMorePosts}
				onEndReachedThreshold={0.5}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
	},
	profileHeader: {
		backgroundColor: "#FFFFFF",
		paddingBottom: 16,
		marginBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	backBtn: {
		position: "absolute",
		left: 16,
		zIndex: 10,
	},
	backBtnText: {
		fontSize: 16,
		color: "#F97316",
		fontWeight: "600",
	},
	avatarSection: {
		alignItems: "center",
		paddingHorizontal: 16,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 3,
		borderColor: "#F97316",
		marginBottom: 12,
	},
	avatarPlaceholder: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#FED7AA",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 12,
		borderWidth: 3,
		borderColor: "#F97316",
	},
	avatarText: {
		fontSize: 28,
		fontWeight: "700",
		color: "#EA580C",
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 4,
	},
	name: {
		fontSize: 20,
		fontWeight: "700",
		color: "#1F2937",
	},
	bio: {
		fontSize: 14,
		color: "#6B7280",
		textAlign: "center",
		marginTop: 4,
		paddingHorizontal: 32,
	},
	stats: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 32,
		marginTop: 20,
		paddingVertical: 16,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	stat: {
		alignItems: "center",
	},
	statNumber: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1F2937",
	},
	statLabel: {
		fontSize: 12,
		color: "#6B7280",
		marginTop: 2,
	},
	actionRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
		paddingHorizontal: 16,
		marginTop: 16,
	},
	editBtn: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	editBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
	},
	logoutBtn: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#EF4444",
		alignItems: "center",
	},
	logoutBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#EF4444",
	},
	themeBtn: {
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	themeBtnText: {
		fontSize: 18,
	},
	followBtn: {
		flex: 1,
		backgroundColor: "#F97316",
		paddingVertical: 10,
		borderRadius: 10,
		alignItems: "center",
	},
	followingBtn: {
		backgroundColor: "#F3F4F6",
	},
	followBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#FFFFFF",
	},
	followingBtnText: {
		color: "#374151",
	},
	messageBtn: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		backgroundColor: "#EFF6FF",
		alignItems: "center",
	},
	messageBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#2563EB",
	},
	blockBtn: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#E5E7EB",
		alignItems: "center",
	},
	blockBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#EF4444",
	},
	postsTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1F2937",
		paddingHorizontal: 16,
		marginTop: 20,
	},
	empty: {
		alignItems: "center",
		paddingTop: 40,
	},
	emptyText: {
		fontSize: 16,
		color: "#9CA3AF",
	},
	footer: {
		paddingVertical: 20,
	},
	lightboxOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.95)",
		justifyContent: "center",
		alignItems: "center",
	},
	lightboxImage: {
		width: Dimensions.get("window").width * 0.9,
		height: Dimensions.get("window").width * 0.9,
		borderRadius: 999,
	},
	lightboxClose: {
		position: "absolute",
		top: 50,
		right: 20,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 20,
		width: 40,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	lightboxCloseText: {
		color: "#FFFFFF",
		fontSize: 20,
		fontWeight: "700",
	},
});
