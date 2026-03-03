import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../utils/prisma.js";
import config from "../../config/index.js";
import { ApiError } from "../../utils/ApiError.js";

const SALT_ROUNDS = 10;

/**
 * Generate a JWT for a given user.
 */
const generateToken = (user) =>
	jwt.sign({ sub: user.id, email: user.email }, config.jwt.secret, {
		expiresIn: config.jwt.expiresIn,
	});

/**
 * Sanitize user object — strip password before returning.
 */
const sanitizeUser = (user) => {
	const { password, ...rest } = user;
	return rest;
};

/**
 * Register a new user.
 */
export const register = async ({ email, password, name }) => {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw ApiError.conflict("Email already registered");
	}

	const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

	const user = await prisma.user.create({
		data: { email, password: hashedPassword, name },
	});

	const token = generateToken(user);
	return { user: sanitizeUser(user), token };
};

/**
 * Log in an existing user.
 */
export const login = async ({ email, password }) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw ApiError.unauthorized("Invalid email or password");
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw ApiError.unauthorized("Invalid email or password");
	}

	const token = generateToken(user);
	return { user: sanitizeUser(user), token };
};

/**
 * Get current authenticated user's profile.
 */
export const getMe = async (userId) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			_count: { select: { posts: true, followers: true, following: true } },
		},
	});

	if (!user) throw ApiError.notFound("User not found");
	return sanitizeUser(user);
};
