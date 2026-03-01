import { Router } from "express";
import * as commentsController from "./comments.controller.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import { createCommentSchema } from "./comments.validation.js";

const router = Router();

router.use(authenticate);

router.post("/:postId", validate(createCommentSchema), commentsController.addComment);
router.get("/:postId", commentsController.getComments);
router.delete("/:commentId", commentsController.deleteComment);

export default router;
