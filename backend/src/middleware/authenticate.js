import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Verify JWT and attach user payload to req.user.
 */
const authenticate = (req, _res, next) => {
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) {
		return next(ApiError.unauthorized("Missing or invalid authorization header"));
	}

	const token = header.split(" ")[1];

	try {
		const decoded = jwt.verify(token, config.jwt.secret);
		req.user = { id: decoded.sub, email: decoded.email };
		next();
	} catch {
		next(ApiError.unauthorized("Invalid or expired token"));
	}
};

export default authenticate;
