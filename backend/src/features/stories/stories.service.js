import prisma from "../../utils/prisma.js";
import { ApiError } from "../../utils/ApiError.js";

const STORY_TTL_HOURS = 24;

const STORY_INCLUDE = {
	user: { select: { id: true, name: true, role: true, avatarUrl: true } },
	_count: { select: { views: true } },
};

/**
 * Get all active stories (not expired), newest per user first.
 * Own story comes first in the list.
 */
export const getActiveStories = async (currentUserId = null) => {
	const stories = await prisma.story.findMany({
		where: { expiresAt: { gt: new Date() } },
		orderBy: { createdAt: "desc" },
		include: STORY_INCLUDE,
	});

	// Put current user's story first
	if (currentUserId) {
		const own = stories.filter((s) => s.userId === currentUserId);
		const others = stories.filter((s) => s.userId !== currentUserId);
		return [...own, ...others];
	}

	return stories;
};

/**
 * Create a story (up to 10 active stories per user within 24h).
 */
export const createStory = async (userId, imageUrl, caption = null) => {
	const expiresAt = new Date(Date.now() + STORY_TTL_HOURS * 60 * 60 * 1000);

	const story = await prisma.story.create({
		data: { userId, imageUrl, caption, expiresAt },
		include: STORY_INCLUDE,
	});

	return story;
};

/**
 * Record that a user has viewed a story (skip own stories).
 */
export const recordView = async (storyId, viewerId) => {
	const story = await prisma.story.findUnique({ where: { id: storyId }, select: { userId: true } });
	if (!story) return;
	if (story.userId === viewerId) return;

	await prisma.storyView.upsert({
		where: { storyId_userId: { storyId, userId: viewerId } },
		update: {},
		create: { storyId, userId: viewerId },
	});
};

/**
 * Get viewers of a story — only accessible by the story owner.
 */
export const getViewers = async (storyId, requesterId) => {
	const story = await prisma.story.findUnique({ where: { id: storyId }, select: { userId: true } });
	if (!story) throw ApiError.notFound("Story not found");
	if (story.userId !== requesterId) throw ApiError.forbidden("Only the story owner can see viewers");

	const rows = await prisma.storyView.findMany({
		where: { storyId },
		orderBy: { viewedAt: "desc" },
		select: {
			viewedAt: true,
			user: { select: { id: true, name: true, avatarUrl: true, role: true } },
		},
	});

	return rows.map((r) => ({ ...r.user, viewedAt: r.viewedAt }));
};

/**
 * Delete a story (owner only).
 */
export const deleteStory = async (storyId, userId) => {
	const story = await prisma.story.findUnique({ where: { id: storyId } });
	if (!story) throw ApiError.notFound("Story not found");
	if (story.userId !== userId) throw ApiError.forbidden("You can only delete your own stories");
	await prisma.story.delete({ where: { id: storyId } });
};
