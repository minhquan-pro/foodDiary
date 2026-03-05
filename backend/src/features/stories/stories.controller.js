import catchAsync from "../../utils/catchAsync.js";
import { ApiError } from "../../utils/ApiError.js";
import * as storiesService from "./stories.service.js";

export const getStories = catchAsync(async (req, res) => {
	const stories = await storiesService.getActiveStories(req.user?.id);
	res.json({ success: true, data: { stories } });
});

export const createStory = catchAsync(async (req, res) => {
	if (!req.file) throw ApiError.badRequest("Image is required");
	const imageUrl = `/uploads/${req.file.filename}`;
	const { caption } = req.body;
	const story = await storiesService.createStory(req.user.id, imageUrl, caption || null);
	res.status(201).json({ success: true, data: { story } });
});

export const recordView = catchAsync(async (req, res) => {
	await storiesService.recordView(req.params.id, req.user.id);
	res.status(204).send();
});

export const getViewers = catchAsync(async (req, res) => {
	const viewers = await storiesService.getViewers(req.params.id, req.user.id);
	res.json({ success: true, data: { viewers } });
});

export const deleteStory = catchAsync(async (req, res) => {
	await storiesService.deleteStory(req.params.id, req.user.id);
	res.status(204).send();
});
