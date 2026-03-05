import catchAsync from "../../utils/catchAsync.js";
import * as bookmarksService from "./bookmarks.service.js";

export const toggleBookmark = catchAsync(async (req, res) => {
	const result = await bookmarksService.toggleBookmark(req.user.id, req.params.postId);
	res.json({ success: true, data: result });
});

export const getBookmarks = catchAsync(async (req, res) => {
	const page = parseInt(req.query.page, 10) || 1;
	const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
	const result = await bookmarksService.getUserBookmarks(req.user.id, { page, limit });
	res.json({ success: true, data: result });
});
