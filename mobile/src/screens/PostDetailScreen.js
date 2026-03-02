import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import {
	View,
	Text,
	ScrollView,
	Image,
	TouchableOpacity,
	TextInput,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Modal,
	Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
	fetchPost,
	toggleLike,
	addComment,
	fetchComments,
	deleteComment,
	deletePost,
	clearCurrentPost,
	toggleCommentLike,
} from "../features/posts/postsSlice";
import StarRating from "../components/StarRating";
import VerifiedBadge from "../components/VerifiedBadge";
import Toast from "react-native-toast-message";
import { getImageUrl } from "../lib/api";

function timeAgo(dateStr) {
	const now = new Date();
	const date = new Date(dateStr);
	const seconds = Math.floor((now - date) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return date.toLocaleDateString();
}

// ─── Comment Item ────────────────────────────────────────────

function CommentItem({ comment, currentUserId, likedCommentIds, onReply, onDelete, onToggleLike, depth = 0 }) {
	const isLiked = likedCommentIds.includes(comment.id);
	const isOwn = currentUserId === comment.user?.id;

	return (
		<View style={[styles.commentItem, { marginLeft: depth * 20 }]}>
			<View style={styles.commentHeader}>
				{comment.user?.avatarUrl ? (
					<Image source={{ uri: getImageUrl(comment.user.avatarUrl) }} style={styles.commentAvatar} />
				) : (
					<View style={styles.commentAvatarPlaceholder}>
						<Text style={styles.commentAvatarText}>{comment.user?.name?.charAt(0).toUpperCase()}</Text>
					</View>
				)}
				<View style={styles.commentMeta}>
					<View style={styles.commentNameRow}>
						<Text style={styles.commentName}>{comment.user?.name}</Text>
						<VerifiedBadge role={comment.user?.role} />
						<Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
					</View>
					<Text style={styles.commentBody}>{comment.body}</Text>
					<View style={styles.commentActions}>
						<TouchableOpacity onPress={() => onToggleLike(comment.id)} style={styles.commentAction}>
							<Text style={[styles.commentActionText, isLiked && { color: "#EF4444" }]}>
								{isLiked ? "❤️" : "🤍"} {comment._count?.commentLikes || 0}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => onReply(comment)} style={styles.commentAction}>
							<Text style={styles.commentActionText}>Reply</Text>
						</TouchableOpacity>
						{isOwn && (
							<TouchableOpacity
								onPress={() => onDelete(comment.id, comment.parentId)}
								style={styles.commentAction}
							>
								<Text style={[styles.commentActionText, { color: "#EF4444" }]}>Delete</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>
			</View>
			{comment.replies?.map((reply) => (
				<CommentItem
					key={reply.id}
					comment={reply}
					currentUserId={currentUserId}
					likedCommentIds={likedCommentIds}
					onReply={onReply}
					onDelete={onDelete}
					onToggleLike={onToggleLike}
					depth={depth + 1}
				/>
			))}
		</View>
	);
}

// ─── Post Detail Screen ─────────────────────────────────────

export default function PostDetailScreen({ route, navigation }) {
	const { postId } = route.params;
	const { colors, isDark } = useTheme();
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);
	const {
		currentPost: post,
		comments,
		commentsPagination,
		likedCommentIds,
		isPostLiked,
		loading,
	} = useSelector((state) => state.posts);

	const [commentText, setCommentText] = useState("");
	const [replyTo, setReplyTo] = useState(null);
	const [imageModalVisible, setImageModalVisible] = useState(false);

	useEffect(() => {
		dispatch(fetchPost(postId));
		dispatch(fetchComments({ postId, page: 1 }));
		return () => {
			dispatch(clearCurrentPost());
		};
	}, [postId]);

	const handleLike = () => {
		dispatch(toggleLike(post.id));
	};

	const handleComment = () => {
		if (!commentText.trim()) return;
		dispatch(
			addComment({
				postId,
				body: commentText.trim(),
				parentId: replyTo?.id || null,
			}),
		);
		setCommentText("");
		setReplyTo(null);
	};

	const handleDeleteComment = (commentId, parentId) => {
		Alert.alert("Delete Comment", "Are you sure?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => dispatch(deleteComment({ commentId, parentId })),
			},
		]);
	};

	const handleDeletePost = () => {
		Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => {
					dispatch(deletePost(postId)).then(() => {
						navigation.goBack();
						Toast.show({ type: "success", text1: "Post deleted" });
					});
				},
			},
		]);
	};

	const handleToggleCommentLike = (commentId) => {
		dispatch(toggleCommentLike(commentId));
	};

	if (loading && !post) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (!post) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
				<Text style={[styles.errorText, { color: colors.textSecondary }]}>Post not found</Text>
			</View>
		);
	}

	const isOwnPost = currentUser?.id === post.user?.id;

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: colors.surface }]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			{/* Header */}
			<View
				style={[
					styles.header,
					{ paddingTop: insets.top + 8, backgroundColor: colors.headerBg, borderBottomColor: colors.border },
				]}
			>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>Post</Text>
				{isOwnPost && (
					<TouchableOpacity onPress={handleDeletePost}>
						<Text style={[styles.deleteBtn, { color: "#EF4444" }]}>Delete</Text>
					</TouchableOpacity>
				)}
			</View>

			<ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
				{/* Image */}
				{post.imageUrl && (
					<TouchableOpacity activeOpacity={0.9} onPress={() => setImageModalVisible(true)}>
						<Image
							source={{ uri: getImageUrl(post.imageUrl) }}
							style={[styles.postImage, { backgroundColor: colors.inputBg }]}
						/>
					</TouchableOpacity>
				)}

				{/* Image Lightbox Modal */}
				<Modal
					visible={imageModalVisible}
					transparent={true}
					animationType="fade"
					onRequestClose={() => setImageModalVisible(false)}
				>
					<TouchableOpacity
						style={styles.lightboxOverlay}
						activeOpacity={1}
						onPress={() => setImageModalVisible(false)}
					>
						<Image
							source={{ uri: getImageUrl(post.imageUrl) }}
							style={styles.lightboxImage}
							resizeMode="contain"
						/>
						<TouchableOpacity style={styles.lightboxClose} onPress={() => setImageModalVisible(false)}>
							<Text style={styles.lightboxCloseText}>✕</Text>
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>

				{/* Post Info */}
				<View style={[styles.postInfo, { backgroundColor: colors.card }]}>
					{/* User */}
					<TouchableOpacity
						style={styles.userRow}
						onPress={() => {
							if (navigation.getParent()) {
								navigation.navigate("UserProfile", { userId: post.user.id });
							}
						}}
					>
						{post.user?.avatarUrl ? (
							<Image
								source={{ uri: getImageUrl(post.user.avatarUrl) }}
								style={[styles.userAvatar, { borderColor: colors.border }]}
							/>
						) : (
							<View style={[styles.userAvatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
								<Text style={[styles.userAvatarText, { color: colors.primary }]}>
									{post.user?.name?.charAt(0).toUpperCase()}
								</Text>
							</View>
						)}
						<View>
							<View style={styles.nameRow}>
								<Text style={[styles.userName, { color: colors.text }]}>{post.user?.name}</Text>
								<VerifiedBadge role={post.user?.role} />
							</View>
							<Text style={[styles.postTime, { color: colors.textMuted }]}>
								{timeAgo(post.createdAt)}
							</Text>
						</View>
					</TouchableOpacity>

					<Text style={[styles.restaurantName, { color: colors.text }]}>{post.restaurantName}</Text>
					<Text style={[styles.address, { color: colors.textMuted }]}>📍 {post.restaurantAddress}</Text>

					<View style={styles.ratingRow}>
						<StarRating rating={post.rating} size={18} />
					</View>

					<Text style={[styles.description, { color: colors.textSecondary }]}>{post.description}</Text>

					{/* Like button */}
					<View style={[styles.postActions, { borderTopColor: colors.inputBg }]}>
						<TouchableOpacity
							style={[styles.likeBtn, isPostLiked && { backgroundColor: isDark ? "#431407" : "#FEF2F2" }]}
							onPress={handleLike}
						>
							<Text style={styles.likeBtnIcon}>{isPostLiked ? "❤️" : "🤍"}</Text>
							<Text style={[styles.likeBtnText, isPostLiked && { color: "#EF4444" }]}>
								{post._count?.likes || 0} likes
							</Text>
						</TouchableOpacity>
						<Text style={[styles.commentCount, { color: colors.textSecondary }]}>
							💬 {post._count?.comments || 0} comments
						</Text>
					</View>
				</View>

				{/* Comments */}
				<View style={[styles.commentsSection, { backgroundColor: colors.card }]}>
					<Text style={[styles.commentsTitle, { color: colors.text }]}>Comments</Text>
					{comments.map((comment) => (
						<CommentItem
							key={comment.id}
							comment={comment}
							currentUserId={currentUser?.id}
							likedCommentIds={likedCommentIds}
							onReply={(c) => setReplyTo(c)}
							onDelete={handleDeleteComment}
							onToggleLike={handleToggleCommentLike}
						/>
					))}
					{commentsPagination?.hasMore && (
						<TouchableOpacity
							onPress={() =>
								dispatch(
									fetchComments({
										postId,
										page: (commentsPagination?.page || 1) + 1,
									}),
								)
							}
							style={styles.loadMoreBtn}
						>
							<Text style={styles.loadMoreText}>Load more comments</Text>
						</TouchableOpacity>
					)}
				</View>
			</ScrollView>

			{/* Comment Input */}
			<View
				style={[
					styles.commentInputContainer,
					{ backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 },
				]}
			>
				{replyTo && (
					<View style={[styles.replyBar, { backgroundColor: colors.primaryLight }]}>
						<Text style={[styles.replyBarText, { color: colors.primary }]}>
							Replying to {replyTo.user?.name}
						</Text>
						<TouchableOpacity onPress={() => setReplyTo(null)}>
							<Text style={[styles.replyBarClose, { color: colors.textMuted }]}>✕</Text>
						</TouchableOpacity>
					</View>
				)}
				<View style={styles.commentInputRow}>
					<TextInput
						style={[styles.commentInput, { backgroundColor: colors.inputBg, color: colors.text }]}
						placeholder={replyTo ? `Reply to ${replyTo.user?.name}...` : "Add a comment..."}
						placeholderTextColor={colors.textMuted}
						value={commentText}
						onChangeText={setCommentText}
						multiline
					/>
					<TouchableOpacity
						onPress={handleComment}
						disabled={!commentText.trim()}
						style={[
							styles.sendBtn,
							{ backgroundColor: colors.primary },
							!commentText.trim() && styles.sendBtnDisabled,
						]}
					>
						<Text style={[styles.sendBtnText, { color: colors.card }]}>Send</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
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
	errorText: {
		fontSize: 16,
		color: "#6B7280",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	backBtn: {
		fontSize: 16,
		color: "#F97316",
		fontWeight: "600",
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#1F2937",
	},
	deleteBtn: {
		fontSize: 14,
		color: "#EF4444",
		fontWeight: "600",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 20,
	},
	postImage: {
		width: "100%",
		height: 280,
		backgroundColor: "#F3F4F6",
	},
	postInfo: {
		padding: 16,
		backgroundColor: "#FFFFFF",
	},
	userRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	userAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
		borderWidth: 1.5,
		borderColor: "#E5E7EB",
	},
	userAvatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
		backgroundColor: "#FED7AA",
		justifyContent: "center",
		alignItems: "center",
	},
	userAvatarText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#EA580C",
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	userName: {
		fontSize: 15,
		fontWeight: "600",
		color: "#1F2937",
	},
	postTime: {
		fontSize: 12,
		color: "#9CA3AF",
		marginTop: 2,
	},
	restaurantName: {
		fontSize: 22,
		fontWeight: "800",
		color: "#1F2937",
		marginBottom: 4,
	},
	address: {
		fontSize: 14,
		color: "#9CA3AF",
		marginBottom: 8,
	},
	ratingRow: {
		marginBottom: 12,
	},
	description: {
		fontSize: 15,
		color: "#4B5563",
		lineHeight: 22,
	},
	postActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		marginTop: 16,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#F3F4F6",
	},
	likeBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	likeBtnActive: {
		backgroundColor: "#FEF2F2",
	},
	likeBtnIcon: {
		fontSize: 18,
	},
	likeBtnText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#6B7280",
	},
	likeBtnTextActive: {
		color: "#EF4444",
	},
	commentCount: {
		fontSize: 14,
		color: "#6B7280",
	},
	commentsSection: {
		padding: 16,
		marginTop: 8,
		backgroundColor: "#FFFFFF",
	},
	commentsTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#1F2937",
		marginBottom: 16,
	},
	commentItem: {
		marginBottom: 16,
	},
	commentHeader: {
		flexDirection: "row",
	},
	commentAvatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 8,
	},
	commentAvatarPlaceholder: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#E5E7EB",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 8,
	},
	commentAvatarText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#6B7280",
	},
	commentMeta: {
		flex: 1,
	},
	commentNameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginBottom: 2,
	},
	commentName: {
		fontSize: 13,
		fontWeight: "600",
		color: "#1F2937",
	},
	commentTime: {
		fontSize: 11,
		color: "#9CA3AF",
		marginLeft: 6,
	},
	commentBody: {
		fontSize: 14,
		color: "#4B5563",
		lineHeight: 20,
		marginBottom: 4,
	},
	commentActions: {
		flexDirection: "row",
		gap: 16,
	},
	commentAction: {
		paddingVertical: 2,
	},
	commentActionText: {
		fontSize: 12,
		color: "#6B7280",
		fontWeight: "500",
	},
	loadMoreBtn: {
		alignItems: "center",
		paddingVertical: 12,
	},
	loadMoreText: {
		fontSize: 14,
		color: "#F97316",
		fontWeight: "600",
	},
	commentInputContainer: {
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
		paddingTop: 8,
		paddingHorizontal: 16,
	},
	replyBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#FFF7ED",
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		marginBottom: 8,
	},
	replyBarText: {
		fontSize: 12,
		color: "#EA580C",
		fontWeight: "500",
	},
	replyBarClose: {
		fontSize: 14,
		color: "#9CA3AF",
		fontWeight: "700",
	},
	commentInputRow: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 8,
	},
	commentInput: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 14,
		color: "#1F2937",
		maxHeight: 100,
	},
	sendBtn: {
		backgroundColor: "#F97316",
		borderRadius: 20,
		paddingHorizontal: 16,
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
	lightboxOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.95)",
		justifyContent: "center",
		alignItems: "center",
	},
	lightboxImage: {
		width: Dimensions.get("window").width,
		height: Dimensions.get("window").height * 0.8,
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
