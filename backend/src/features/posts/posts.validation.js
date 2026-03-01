import { z } from "zod";

export const createPostSchema = z.object({
	restaurantName: z.string().min(1, "Restaurant name is required").max(200),
	restaurantAddress: z.string().min(1, "Restaurant address is required").max(500),
	rating: z.coerce.number().int().min(1).max(5),
	description: z.string().min(1, "Description is required").max(2000),
});

export const updatePostSchema = z.object({
	restaurantName: z.string().min(1).max(200).optional(),
	restaurantAddress: z.string().min(1).max(500).optional(),
	rating: z.coerce.number().int().min(1).max(5).optional(),
	description: z.string().min(1).max(2000).optional(),
});
