import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { getAllBlockedUserIds } from "../blocks/blocks.service.js";

const POST_INCLUDE = {
	user: { select: { id: true, name: true, role: true, avatarUrl: true } },
	_count: { select: { likes: true, comments: true } },
};

/**
 * Search distinct restaurant names.
 */
export const searchRestaurantNames = async (query, limit = 8) => {
	const posts = await prisma.post.findMany({
		where: { restaurantName: { contains: query } },
		select: { restaurantName: true },
		distinct: ["restaurantName"],
		orderBy: { restaurantName: "asc" },
		take: limit,
	});
	return posts.map((p) => p.restaurantName);
};

/**
 * Create a food review post.
 */
export const createPost = async (userId, data, imageUrl) => {
	const post = await prisma.post.create({
		data: {
			...data,
			imageUrl,
			userId,
		},
		include: POST_INCLUDE,
	});
	return post;
};

/**
 * Get paginated feed of latest posts, optionally filtered by location.
 * Excludes posts from blocked users (both directions).
 */
export const getFeed = async ({ page = 1, limit = 10, location = null, userId = null }) => {
	const skip = (page - 1) * limit;

	const where = {};
	if (location) where.restaurantAddress = { contains: location };

	// Filter out blocked users
	if (userId) {
		const blockedIds = await getAllBlockedUserIds(userId);
		if (blockedIds.length > 0) {
			where.userId = { notIn: blockedIds };
		}
	}

	let [posts, total] = await Promise.all([
		prisma.post.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
			include: POST_INCLUDE,
		}),
		prisma.post.count({ where }),
	]);

	// attach reactions counts
	posts = await attachReactionsToPosts(posts);

	// Get liked post IDs and user's reactions in parallel
	let likedPostIds = [];
	let userReactedPosts = {};
	if (userId && posts.length > 0) {
		const postIds = posts.map((p) => p.id);
		const [likes, userRxs] = await Promise.all([
			prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
			prisma.postReaction.findMany({
				where: { userId, postId: { in: postIds } },
				select: { postId: true, emoji: true },
			}),
		]);
		likedPostIds = likes.map((l) => l.postId);
		for (const r of userRxs) userReactedPosts[r.postId] = r.emoji;
	}

	return {
		posts,
		likedPostIds,
		userReactedPosts,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

// Helper to attach reaction counts to posts array
const attachReactionsToPosts = async (posts) => {
	if (!posts || posts.length === 0) return posts;
	const postIds = posts.map((p) => p.id);
	const groups = await prisma.postReaction.groupBy({
		by: ["postId", "emoji"],
		where: { postId: { in: postIds } },
		_count: { emoji: true },
	});

	const map = {};
	for (const g of groups) {
		if (!map[g.postId]) map[g.postId] = [];
		map[g.postId].push({ emoji: g.emoji, count: g._count.emoji });
	}

	return posts.map((p) => ({ ...p, reactions: map[p.id] || [] }));
};

/**
 * Get distinct city/location names extracted from restaurant addresses.
 */
export const getDistinctLocations = async () => {
	const posts = await prisma.post.findMany({
		select: { restaurantAddress: true },
		distinct: ["restaurantAddress"],
	});

	// Extract city names from addresses (last part after the last comma)
	const citySet = new Set();
	for (const p of posts) {
		const parts = p.restaurantAddress.split(",").map((s) => s.trim());
		if (parts.length > 0) {
			citySet.add(parts[parts.length - 1]);
		}
	}

	return Array.from(citySet).sort();
};

/**
 * Get posts from users that the current user follows.
 * Excludes posts from blocked users (both directions).
 */
export const getFriendsFeed = async (userId, { page = 1, limit = 10 }) => {
	const skip = (page - 1) * limit;

	// Get IDs of users the current user follows
	const following = await prisma.follow.findMany({
		where: { followerId: userId },
		select: { followingId: true },
	});

	// Get blocked user IDs (both directions)
	const blockedIds = await getAllBlockedUserIds(userId);

	// Filter out blocked users from following list
	const followingIds = following.map((f) => f.followingId).filter((id) => !blockedIds.includes(id));

	let [posts, total] = await Promise.all([
		prisma.post.findMany({
			where: { userId: { in: followingIds } },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
			include: POST_INCLUDE,
		}),
		prisma.post.count({ where: { userId: { in: followingIds } } }),
	]);

	// attach reactions counts
	posts = await attachReactionsToPosts(posts);

	// Get liked post IDs and user's reactions in parallel
	let likedPostIds = [];
	let userReactedPosts = {};
	if (posts.length > 0) {
		const postIds = posts.map((p) => p.id);
		const [likes, userRxs] = await Promise.all([
			prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
			prisma.postReaction.findMany({
				where: { userId, postId: { in: postIds } },
				select: { postId: true, emoji: true },
			}),
		]);
		likedPostIds = likes.map((l) => l.postId);
		for (const r of userRxs) userReactedPosts[r.postId] = r.emoji;
	}

	return {
		posts,
		likedPostIds,
		userReactedPosts,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
};

/**
 * Get a single post by ID.
 */
export const getPostById = async (postId, userId = null) => {
	const post = await prisma.post.findUnique({
		where: { id: postId },
		include: {
			...POST_INCLUDE,
			comments: {
				where: { parentId: null },
				orderBy: { createdAt: "desc" },
				take: 20,
				include: {
					user: { select: { id: true, name: true, role: true, avatarUrl: true } },
					_count: { select: { commentLikes: true } },
					replies: {
						orderBy: { createdAt: "asc" },
						include: {
							user: { select: { id: true, name: true, role: true, avatarUrl: true } },
							_count: { select: { commentLikes: true } },
							replies: {
								orderBy: { createdAt: "asc" },
								include: {
									user: { select: { id: true, name: true, role: true, avatarUrl: true } },
									_count: { select: { commentLikes: true } },
								},
							},
						},
					},
				},
			},
		},
	});

	if (!post) throw ApiError.notFound("Post not found");
	// attach reactions
	const groups = await prisma.postReaction.groupBy({
		by: ["emoji"],
		where: { postId },
		_count: { emoji: true },
	});
	post.reactions = groups.map((g) => ({ emoji: g.emoji, count: g._count.emoji }));

	let userReaction = null;
	if (userId) {
		const ur = await prisma.postReaction.findFirst({ where: { postId, userId }, select: { emoji: true } });
		userReaction = ur?.emoji ?? null;
	}

	return { post, userReaction };
};

/**
 * Get a post by its share slug (for public sharing).
 */
export const getPostBySlug = async (slug) => {
	const post = await prisma.post.findUnique({
		where: { shareSlug: slug },
		include: {
			...POST_INCLUDE,
			comments: {
				where: { parentId: null },
				orderBy: { createdAt: "desc" },
				take: 20,
				include: {
					user: { select: { id: true, name: true, role: true, avatarUrl: true } },
					_count: { select: { commentLikes: true } },
					replies: {
						orderBy: { createdAt: "asc" },
						include: {
							user: { select: { id: true, name: true, role: true, avatarUrl: true } },
							_count: { select: { commentLikes: true } },
							replies: {
								orderBy: { createdAt: "asc" },
								include: {
									user: { select: { id: true, name: true, role: true, avatarUrl: true } },
									_count: { select: { commentLikes: true } },
								},
							},
						},
					},
				},
			},
		},
	});

	if (!post) throw ApiError.notFound("Post not found");
	return post;
};

/**
 * Update a post (owner only).
 */
export const updatePost = async (postId, userId, data) => {
	const post = await prisma.post.findUnique({ where: { id: postId } });
	if (!post) throw ApiError.notFound("Post not found");
	if (post.userId !== userId) throw ApiError.forbidden("You can only edit your own posts");

	return prisma.post.update({
		where: { id: postId },
		data,
		include: POST_INCLUDE,
	});
};

/**
 * Delete a post (owner only).
 */
export const deletePost = async (postId, userId) => {
	const post = await prisma.post.findUnique({ where: { id: postId } });
	if (!post) throw ApiError.notFound("Post not found");
	if (post.userId !== userId) throw ApiError.forbidden("You can only delete your own posts");

	await prisma.post.delete({ where: { id: postId } });
};

/**
 * Toggle a reaction (emoji) on a post by a user.
 * Facebook-style: one reaction per user. Same emoji = remove, different emoji = switch.
 */
export const togglePostReaction = async (postId, userId, emoji = "❤️") => {
	const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
	if (!post) throw ApiError.notFound("Post not found");

	// Find any existing reaction by this user (one per user, Facebook-style)
	const existing = await prisma.postReaction.findFirst({ where: { userId, postId } });

	if (existing) {
		if (existing.emoji === emoji) {
			// Same emoji → remove (toggle off)
			await prisma.postReaction.delete({ where: { id: existing.id } });
			return { removed: true, emoji };
		}
		// Different emoji → switch reaction
		await prisma.postReaction.update({ where: { id: existing.id }, data: { emoji } });
		return { removed: false, switched: true, prevEmoji: existing.emoji, emoji };
	}

	const created = await prisma.postReaction.create({ data: { userId, postId, emoji } });
	return { removed: false, emoji, id: created.id };
};

/**
 * Get reaction counts grouped by emoji for a post.
 * Optionally indicate which emojis the given user has reacted with.
 */
export const getPostReactions = async (postId, userId = null) => {
	const reactions = await prisma.postReaction.groupBy({
		by: ["emoji"],
		where: { postId },
		_count: { emoji: true },
	});

	const result = reactions.map((r) => ({ emoji: r.emoji, count: r._count.emoji }));

	let userReactions = [];
	if (userId) {
		const urs = await prisma.postReaction.findMany({ where: { postId, userId }, select: { emoji: true } });
		userReactions = urs.map((u) => u.emoji);
	}

	return { reactions: result, userReactions };
};
