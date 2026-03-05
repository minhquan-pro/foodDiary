import catchAsync from "../../utils/catchAsync.js";
import { ApiError } from "../../utils/ApiError.js";
import * as mapService from "./map.service.js";

export const getMapData = catchAsync(async (req, res) => {
	const data = await mapService.getMapData(req.user?.id);
	res.json({ success: true, data });
});

export const setLocation = catchAsync(async (req, res) => {
	const { latitude, longitude, label, days } = req.body;

	if (latitude == null || longitude == null) {
		throw ApiError.badRequest("latitude and longitude are required");
	}

	const parsedDays = parseInt(days, 10);
	if (![1, 3, 7].includes(parsedDays)) {
		throw ApiError.badRequest("days must be 1, 3, or 7");
	}

	const location = await mapService.setUserLocation(req.user.id, {
		latitude: parseFloat(latitude),
		longitude: parseFloat(longitude),
		label: label ?? null,
		days: parsedDays,
	});

	res.json({ success: true, data: { location } });
});

export const clearLocation = catchAsync(async (req, res) => {
	await mapService.clearUserLocation(req.user.id);
	res.status(204).send();
});
