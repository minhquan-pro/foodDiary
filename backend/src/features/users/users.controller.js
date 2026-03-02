import * as usersService from "./users.service.js";
import * as notificationsService from "../notifications/notifications.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const searchUsers = catchAsync(async (req, res) => {
	const { q, page = 1, limit = 10 } = req.query;
	if (!q || !q.trim()) {
		return res.json({
			success: true,
			data: { users: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } },
		});
	}
	const result = await usersService.searchUsers(q.trim(), { page: parseInt(page), limit: parseInt(limit) });
	res.json({ success: true, data: result });
});

export const getProfile = catchAsync(async (req, res) => {
	const user = await usersService.getProfile(req.params.id);
	res.json({ success: true, data: { user } });
});

export const getUserPosts = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = parseInt(req.query.limit, 10) || 10;
	const result = await usersService.getUserPosts(req.params.id, { page, limit }, req.user?.id);
	res.json({ success: true, data: result });
});

export const updateProfile = catchAsync(async (req, res) => {
	const user = await usersService.updateProfile(req.user.id, req.body, req.file);
	res.json({ success: true, data: { user } });
});

export const followUser = catchAsync(async (req, res) => {
	const result = await usersService.followUser(req.user.id, req.params.id);

	// Send follow notification
	if (req.user.id !== req.params.id) {
		const notification = await notificationsService.createNotification({
			type: "follow",
			userId: req.params.id,
			actorId: req.user.id,
		});

		if (notification) {
			const io = req.app.get("io");
			io.to(`user:${req.params.id}`).emit("notification:new", notification);
		}
	}

	res.json({ success: true, data: result });
});

export const unfollowUser = catchAsync(async (req, res) => {
	const result = await usersService.unfollowUser(req.user.id, req.params.id);
	res.json({ success: true, data: result });
});

export const getFollowStatus = catchAsync(async (req, res) => {
	const result = await usersService.getFollowStatus(req.user.id, req.params.id);
	res.json({ success: true, data: result });
});

export const getFollowingIds = catchAsync(async (req, res) => {
	const ids = await usersService.getFollowingIds(req.user.id);
	res.json({ success: true, data: { followingIds: ids } });
});

export const getFollowers = catchAsync(async (req, res) => {
	const users = await usersService.getFollowers(req.params.id);
	res.json({ success: true, data: { users } });
});

export const getFollowing = catchAsync(async (req, res) => {
	const users = await usersService.getFollowing(req.params.id);
	res.json({ success: true, data: { users } });
});

export const getFriends = catchAsync(async (req, res) => {
	const users = await usersService.getFriends(req.params.id);
	res.json({ success: true, data: { users } });
});
