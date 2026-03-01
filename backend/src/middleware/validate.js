import { ZodError } from "zod";

/**
 * Create middleware that validates req.body against a Zod schema.
 */
const validate = (schema) => (req, _res, next) => {
	try {
		req.body = schema.parse(req.body);
		next();
	} catch (err) {
		if (err instanceof ZodError) {
			const errors = err.errors.map((e) => ({
				field: e.path.join("."),
				message: e.message,
			}));
			return next({
				statusCode: 400,
				message: "Validation failed",
				errors,
				name: "ApiError",
			});
		}
		next(err);
	}
};

export default validate;
