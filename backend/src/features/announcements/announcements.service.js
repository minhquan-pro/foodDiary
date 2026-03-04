import prisma from "../../utils/prisma.js";

const USER_SELECT = { select: { id: true, name: true, avatarUrl: true, role: true } };

/**
 * Get all announcements that have not yet expired.
 */
export const getActiveAnnouncements = async () => {
	return prisma.announcement.findMany({
		where: { expiresAt: { gt: new Date() } },
		include: { user: USER_SELECT },
		orderBy: { createdAt: "desc" },
	});
};

/**
 * Find a single announcement by id (for ownership checks).
 */
export const getAnnouncementById = async (id) => {
	return prisma.announcement.findUnique({ where: { id } });
};

/**
 * Hard-delete an announcement.
 */
export const deleteAnnouncement = async (id) => {
	await prisma.announcement.delete({ where: { id } });
};

/**
 * Create a story-style announcement (with image) that expires 24 hours from now.
 */
export const createAnnouncement = async (userId, { message }, imageUrl) => {
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
	return prisma.announcement.create({
		data: { imageUrl, message: message || null, userId, expiresAt },
		include: { user: USER_SELECT },
	});
};
