/**
 * Wrap an async route handler to catch errors and pass them to Express error middleware.
 */
const catchAsync = (fn) => (req, res, next) => {
	Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
