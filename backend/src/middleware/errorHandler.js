import config from "../config/index.js";

/**
 * Global error handler middleware.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
	const statusCode = err.statusCode || 500;
	const message = err.message || "Internal server error";
	const errors = err.errors || [];

	if (config.nodeEnv === "development") {
		console.error("ERROR:", err);
	}

	res.status(statusCode).json({
		success: false,
		message,
		...(errors.length > 0 && { errors }),
		...(config.nodeEnv === "development" && { stack: err.stack }),
	});
};

export default errorHandler;
