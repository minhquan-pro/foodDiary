import * as authService from "./auth.service.js";
import catchAsync from "../../utils/catchAsync.js";

export const register = catchAsync(async (req, res) => {
	const result = await authService.register(req.body);
	res.status(201).json({ success: true, data: result });
});

export const login = catchAsync(async (req, res) => {
	const result = await authService.login(req.body);
	res.json({ success: true, data: result });
});

export const getMe = catchAsync(async (req, res) => {
	const user = await authService.getMe(req.user.id);
	res.json({ success: true, data: { user } });
});
