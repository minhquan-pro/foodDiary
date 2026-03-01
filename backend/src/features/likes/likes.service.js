import prisma from "../../utils/prisma.js";

/**
 * Toggle like on a post. Returns the new like status.
 */
export const toggleLike = async (userId, postId) => {
	const existing = await prisma.like.findUnique({
		where: { userId_postId: { userId, postId } },
	});

	if (existing) {
		await prisma.like.delete({ where: { id: existing.id } });
		return { liked: false };
	}

	await prisma.like.create({ data: { userId, postId } });
	return { liked: true };
};

/**
 * Get like count for a post and whether the current user liked it.
 */
export const getLikeStatus = async (userId, postId) => {
	const [count, userLike] = await Promise.all([
		prisma.like.count({ where: { postId } }),
		prisma.like.findUnique({
			where: { userId_postId: { userId, postId } },
		}),
	]);

	return { count, liked: !!userLike };
};
