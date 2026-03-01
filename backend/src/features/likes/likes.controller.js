import * as likesService from "./likes.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const toggleLike = catchAsync(async (req, res) => {
	const result = await likesService.toggleLike(req.user.id, req.params.postId);
	res.json({ success: true, data: result });
});

export const getLikeStatus = catchAsync(async (req, res) => {
	const result = await likesService.getLikeStatus(req.user.id, req.params.postId);
	res.json({ success: true, data: result });
});
