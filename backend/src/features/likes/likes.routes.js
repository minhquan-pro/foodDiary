import { Router } from "express";
import * as likesController from "./likes.controller.js";
import authenticate from "../../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.post("/:postId", likesController.toggleLike);
router.get("/:postId", likesController.getLikeStatus);

export default router;
