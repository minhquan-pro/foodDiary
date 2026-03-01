import { z } from "zod";

export const createCommentSchema = z.object({
	body: z.string().min(1, "Comment cannot be empty").max(1000),
	parentId: z.string().uuid().optional(),
});
