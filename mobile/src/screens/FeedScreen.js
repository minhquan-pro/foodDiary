import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchFeed,
	fetchFriendsFeed,
	fetchFollowingIds,
	fetchBlockedIds,
	setFeedType,
	fetchLocations,
} from "../features/feed/feedSlice";
import { fetchUnreadCount } from "../features/chat/chatSlice";
import { fetchUnreadCount as fetchNotifUnread } from "../features/notifications/notificationsSlice";
import PostCard from "../components/PostCard";
import { useTheme } from "../context/ThemeContext";

export default function FeedScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { colors, isDark } = useTheme();
	const { posts, loading, pagination, feedType } = useSelector((state) => state.feed);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadData();
	}, [feedType]);

	const loadData = () => {
		if (feedType === "friends") {
			dispatch(fetchFriendsFeed({ page: 1 }));
		} else {
			dispatch(fetchFeed({ page: 1 }));
		}
		dispatch(fetchFollowingIds());
		dispatch(fetchBlockedIds());
		dispatch(fetchLocations());
		dispatch(fetchUnreadCount());
		dispatch(fetchNotifUnread());
	};

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		const fetchAction = feedType === "friends" ? fetchFriendsFeed({ page: 1 }) : fetchFeed({ page: 1 });
		dispatch(fetchAction).finally(() => setRefreshing(false));
		dispatch(fetchFollowingIds());
		dispatch(fetchBlockedIds());
	}, [feedType]);

	const loadMore = () => {
		if (loading || !pagination?.hasMore) return;
		const nextPage = (pagination?.page || 1) + 1;
		if (feedType === "friends") {
			dispatch(fetchFriendsFeed({ page: nextPage }));
		} else {
			dispatch(fetchFeed({ page: nextPage }));
		}
	};

	const renderPost = ({ item }) => (
		<PostCard
			post={item}
			onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
			onUserPress={(userId) => navigation.navigate("UserProfile", { userId })}
		/>
	);

	const ListHeader = () => (
		<View style={[styles.headerContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<Text style={[styles.logo, { color: colors.text }]}>🍽️ FoodDiary</Text>
				<View style={styles.headerActions}>
					<TouchableOpacity
						onPress={() => navigation.getParent()?.navigate("UserSearch")}
						style={[styles.searchBtn, { backgroundColor: colors.inputBg }]}
					>
						<Text style={styles.searchBtnText}>🔍</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => navigation.navigate("CreatePost")} style={styles.createBtn}>
						<Text style={styles.createBtnText}>+ Post</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Feed Type Tabs */}
			<View style={styles.tabs}>
				<TouchableOpacity
					style={[styles.tab, { backgroundColor: colors.inputBg }, feedType === "latest" && styles.tabActive]}
					onPress={() => dispatch(setFeedType("latest"))}
				>
					<Text
						style={[
							styles.tabText,
							{ color: colors.textSecondary },
							feedType === "latest" && styles.tabTextActive,
						]}
					>
						Latest
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.tab,
						{ backgroundColor: colors.inputBg },
						feedType === "friends" && styles.tabActive,
					]}
					onPress={() => dispatch(setFeedType("friends"))}
				>
					<Text
						style={[
							styles.tabText,
							{ color: colors.textSecondary },
							feedType === "friends" && styles.tabTextActive,
						]}
					>
						Friends
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<FlatList
				data={posts}
				keyExtractor={(item) => String(item.id)}
				renderItem={renderPost}
				ListHeaderComponent={ListHeader}
				ListEmptyComponent={
					!loading ? (
						<View style={styles.empty}>
							<Text style={styles.emptyIcon}>🍽️</Text>
							<Text style={styles.emptyText}>No posts yet</Text>
							<Text style={styles.emptySubtext}>Be the first to share a food review!</Text>
						</View>
					) : null
				}
				ListFooterComponent={
					loading && posts.length > 0 ? (
						<ActivityIndicator style={styles.loadingMore} size="small" color="#F97316" />
					) : null
				}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={["#F97316"]}
						tintColor="#F97316"
					/>
				}
				onEndReached={loadMore}
				onEndReachedThreshold={0.5}
				contentContainerStyle={styles.listContent}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	listContent: {
		paddingBottom: 20,
	},
	headerContainer: {
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
		marginBottom: 8,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	logo: {
		fontSize: 24,
		fontWeight: "800",
		color: "#1F2937",
	},
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	searchBtn: {
		backgroundColor: "#F3F4F6",
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: "center",
		alignItems: "center",
	},
	searchBtnText: {
		fontSize: 16,
	},
	createBtn: {
		backgroundColor: "#F97316",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	createBtnText: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 14,
	},
	tabs: {
		flexDirection: "row",
		paddingHorizontal: 16,
		gap: 8,
		paddingBottom: 12,
	},
	tab: {
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: "#F3F4F6",
	},
	tabActive: {
		backgroundColor: "#F97316",
	},
	tabText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
	},
	tabTextActive: {
		color: "#FFFFFF",
	},
	empty: {
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
	loadingMore: {
		paddingVertical: 20,
	},
});
