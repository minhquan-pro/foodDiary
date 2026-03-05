import { Router } from "express";
import authenticate from "../../middleware/authenticate.js";
import upload from "../../utils/upload.js";
import * as storiesController from "./stories.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", storiesController.getStories);
router.post("/", upload.single("image"), storiesController.createStory);
router.post("/:id/views", storiesController.recordView);
router.get("/:id/viewers", storiesController.getViewers);
router.delete("/:id", storiesController.deleteStory);

export default router;
