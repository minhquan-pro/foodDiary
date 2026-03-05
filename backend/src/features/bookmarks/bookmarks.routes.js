import { Router } from "express";
import * as bookmarksController from "./bookmarks.controller.js";
import authenticate from "../../middleware/authenticate.js";

const router = Router();
router.use(authenticate);
router.post("/:postId", bookmarksController.toggleBookmark);
router.get("/", bookmarksController.getBookmarks);
export default router;
