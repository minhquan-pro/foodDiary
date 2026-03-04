// removed duplicate import
import catchAsync from "../../utils/catchAsync.js";
import { ApiError } from "../../utils/ApiError.js";
import * as postsService from "./posts.service.js";
import * as notificationsService from "../notifications/notifications.service.js";

export const createPost = catchAsync(async (req, res) => {
	if (!req.file) throw ApiError.badRequest("Food image is required");

	const imageUrl = `/uploads/${req.file.filename}`;
	const post = await postsService.createPost(req.user.id, req.body, imageUrl);
	res.status(201).json({ success: true, data: { post } });
});

export const searchRestaurantNames = catchAsync(async (req, res) => {
	const { q } = req.query;
	if (!q || !q.trim()) {
		return res.json({ success: true, data: { names: [] } });
	}
	const names = await postsService.searchRestaurantNames(q.trim());
	res.json({ success: true, data: { names } });
});

export const getFeed = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 10;
	const location = req.query.location || null;
	const userId = req.user?.id || null;
	const result = await postsService.getFeed({ page, limit, location, userId });
	res.json({ success: true, data: result });
});

export const getLocations = catchAsync(async (req, res) => {
	const locations = await postsService.getDistinctLocations();
	res.json({ success: true, data: { locations } });
});

export const getFriendsFeed = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 10;
	const result = await postsService.getFriendsFeed(req.user.id, { page, limit });
	res.json({ success: true, data: result });
});

export const getPostById = catchAsync(async (req, res) => {
	const { post, userReaction, isPostBookmarked, isPostLiked } = await postsService.getPostById(req.params.id, req.user?.id);

	// Get liked comment IDs for current user
	let likedCommentIds = [];
	if (req.user && post.comments?.length) {
		const extractIds = (comments) => {
			const ids = [];
			for (const c of comments) {
				ids.push(c.id);
				if (c.replies) ids.push(...extractIds(c.replies));
			}
			return ids;
		};
		const { getUserLikedCommentIds } = await import("../comments/comments.service.js");
		likedCommentIds = await getUserLikedCommentIds(req.user.id, extractIds(post.comments));
	}

	res.json({ success: true, data: { post, likedCommentIds, isPostLiked, isPostBookmarked, userReaction } });
});

export const getPostBySlug = catchAsync(async (req, res) => {
	const post = await postsService.getPostBySlug(req.params.slug);
	res.json({ success: true, data: { post } });
});

export const updatePost = catchAsync(async (req, res) => {
	const post = await postsService.updatePost(req.params.id, req.user.id, req.body);
	res.json({ success: true, data: { post } });
});

export const deletePost = catchAsync(async (req, res) => {
	await postsService.deletePost(req.params.id, req.user.id);
	res.status(204).send();
});

export const toggleReaction = catchAsync(async (req, res) => {
	const postId = req.params.id;
	const { emoji } = req.body;
	const userId = req.user.id;

	const result = await postsService.togglePostReaction(postId, userId, emoji);

	const io = req.app.get("io");

	// Create notification for post owner when adding/switching reaction (not removing)
	if (!result.removed) {
		try {
			const notification = await notificationsService.createNotification({
				type: "reaction",
				userId: result.postOwnerId,
				actorId: userId,
				postId,
			});
			if (notification) {
				io.to(`user:${result.postOwnerId}`).emit("notification:new", notification);
			}
		} catch (err) {
			console.error("Failed to create reaction notification", err);
		}
	}

	// Emit socket event so clients can update realtime
	try {
		const rx = await postsService.getPostReactions(postId, null);
		io.to(`post:${postId}`).emit("post:reactionUpdated", { postId, reactions: rx.reactions });
		io.emit("post:reactionUpdated", { postId, reactions: rx.reactions });
	} catch (err) {
		console.error("Failed to emit reaction update", err);
	}

	res.json({ success: true, data: result });
});

export const getReactions = catchAsync(async (req, res) => {
	const postId = req.params.id;
	const userId = req.user?.id || null;
	const data = await postsService.getPostReactions(postId, userId);
	res.json({ success: true, data });
});

export const getReactionUsers = catchAsync(async (req, res) => {
	const { id: postId } = req.params;
	const { emoji } = req.query;
	const users = await postsService.getReactionUsers(postId, emoji || null);
	res.json({ success: true, data: { users } });
});

export const getExplorePosts = catchAsync(async (req, res) => {
	const sortBy = req.query.sortBy || "trending";
	const page = parseInt(req.query.page, 10) || 1;
	const limit = Math.min(parseInt(req.query.limit, 10) || 21, 63);
	if (!["trending", "top", "newest"].includes(sortBy)) {
		throw ApiError.badRequest("sortBy must be one of: trending, top, newest");
	}
	const result = await postsService.getExplorePosts({ sortBy, page, limit, userId: req.user?.id || null });
	res.json({ success: true, data: result });
});

export const getTopRestaurants = catchAsync(async (req, res) => {
	const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
	const restaurants = await postsService.getTopRestaurants({ limit });
	res.json({ success: true, data: { restaurants } });
});

export const getMapPosts = catchAsync(async (req, res) => {
	const posts = await postsService.getMapPosts();
	res.json({ success: true, data: { posts } });
});

export const getStories = catchAsync(async (req, res) => {
	const stories = await postsService.getStories(req.user.id);
	res.json({ success: true, data: { stories } });
});

export const createStory = catchAsync(async (req, res) => {
	if (!req.file) throw ApiError.badRequest("Image is required");
	const imageUrl = `/uploads/${req.file.filename}`;
	const caption = req.body.caption || "";
	const story = await postsService.createStory(req.user.id, caption, imageUrl);
	res.status(201).json({ success: true, data: { story } });
});

export const recordView = catchAsync(async (req, res) => {
	await postsService.recordPostView(req.params.id, req.user.id);
	res.status(204).send();
});

export const getViewers = catchAsync(async (req, res) => {
	const viewers = await postsService.getPostViewers(req.params.id, req.user.id);
	res.json({ success: true, data: { viewers } });
});
