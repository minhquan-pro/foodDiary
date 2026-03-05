import prisma from "../../utils/prisma.js";

/**
 * Get all map data: posts with coords + active user check-in locations.
 */
export const getMapData = async (currentUserId = null) => {
	const [posts, userLocations] = await Promise.all([
		prisma.post.findMany({
			where: {
				latitude: { not: null },
				longitude: { not: null },
			},
			select: {
				id: true,
				imageUrl: true,
				restaurantName: true,
				dishName: true,
				restaurantAddress: true,
				rating: true,
				latitude: true,
				longitude: true,
				shareSlug: true,
				user: { select: { id: true, name: true, avatarUrl: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.userLocation.findMany({
			where: { expiresAt: { gt: new Date() } },
			include: { user: { select: { id: true, name: true, avatarUrl: true } } },
			orderBy: { createdAt: "desc" },
		}),
	]);

	const myLocation = currentUserId
		? userLocations.find((ul) => ul.userId === currentUserId) ?? null
		: null;

	return { posts, userLocations, myLocation };
};

/**
 * Set (upsert) a user's check-in location. days = 1 | 3 | 7.
 */
export const setUserLocation = async (userId, { latitude, longitude, label = null, days = 7 }) => {
	const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

	const location = await prisma.userLocation.upsert({
		where: { userId },
		update: { latitude, longitude, label, expiresAt, createdAt: new Date() },
		create: { userId, latitude, longitude, label, expiresAt },
		include: { user: { select: { id: true, name: true, avatarUrl: true } } },
	});

	return location;
};

/**
 * Clear a user's check-in location.
 */
export const clearUserLocation = async (userId) => {
	await prisma.userLocation.deleteMany({ where: { userId } });
};
