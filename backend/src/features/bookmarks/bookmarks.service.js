import prisma from "../../utils/prisma.js";

const POST_INCLUDE = {
	user: { select: { id: true, name: true, role: true, avatarUrl: true } },
	_count: { select: { likes: true, comments: true, bookmarks: true } },
};

export const toggleBookmark = async (userId, postId) => {
	const existing = await prisma.bookmark.findUnique({
		where: { userId_postId: { userId, postId } },
	});
	if (existing) {
		await prisma.bookmark.delete({ where: { id: existing.id } });
		return { bookmarked: false };
	}
	await prisma.bookmark.create({ data: { userId, postId } });
	return { bookmarked: true };
};

export const getUserBookmarks = async (userId, { page = 1, limit = 10 }) => {
	const skip = (page - 1) * limit;
	const [bookmarks, total] = await Promise.all([
		prisma.bookmark.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			skip,
			take: limit,
			include: { post: { include: POST_INCLUDE } },
		}),
		prisma.bookmark.count({ where: { userId } }),
	]);

	const posts = bookmarks.map((b) => b.post);

	if (posts.length > 0) {
		const postIds = posts.map((p) => p.id);
		const [groups, likes, userRxs] = await Promise.all([
			prisma.postReaction.groupBy({
				by: ["postId", "emoji"],
				where: { postId: { in: postIds } },
				_count: { emoji: true },
			}),
			prisma.like.findMany({ where: { userId, postId: { in: postIds } }, select: { postId: true } }),
			prisma.postReaction.findMany({
				where: { userId, postId: { in: postIds } },
				select: { postId: true, emoji: true },
			}),
		]);

		const reactionsMap = {};
		for (const g of groups) {
			if (!reactionsMap[g.postId]) reactionsMap[g.postId] = [];
			reactionsMap[g.postId].push({ emoji: g.emoji, count: g._count.emoji });
		}
		posts.forEach((p) => {
			p.reactions = reactionsMap[p.id] || [];
		});

		const likedPostIds = likes.map((l) => l.postId);
		const userReactedPosts = {};
		for (const r of userRxs) userReactedPosts[r.postId] = r.emoji;

		return {
			posts,
			likedPostIds,
			userReactedPosts,
			bookmarkedPostIds: postIds, // all returned posts are bookmarked
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		};
	}

	return {
		posts,
		likedPostIds: [],
		userReactedPosts: {},
		bookmarkedPostIds: [],
		pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};
