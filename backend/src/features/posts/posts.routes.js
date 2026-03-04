import { Router } from "express";
import * as postsController from "./posts.controller.js";
import authenticate from "../../middleware/authenticate.js";
import validate from "../../middleware/validate.js";
import upload from "../../utils/upload.js";
import { createPostSchema, updatePostSchema } from "./posts.validation.js";

const router = Router();

// Public
router.get("/share/:slug", postsController.getPostBySlug);

// Protected
router.use(authenticate);

router.get("/locations", postsController.getLocations);
router.get("/restaurant-names", postsController.searchRestaurantNames);
router.get("/stories", postsController.getStories);
router.post("/stories", upload.single("image"), postsController.createStory);
router.get("/feed", postsController.getFeed);
router.get("/friends", postsController.getFriendsFeed);
router.get("/explore", postsController.getExplorePosts);
router.get("/top-restaurants", postsController.getTopRestaurants);
router.get("/map", postsController.getMapPosts);
router.get("/:id", postsController.getPostById);
router.get("/:id/reactions", postsController.getReactions);
router.get("/:id/reactions/users", postsController.getReactionUsers);
router.get("/:id/viewers", postsController.getViewers);
router.post("/:id/views", postsController.recordView);

router.post("/", upload.single("image"), validate(createPostSchema), postsController.createPost);

router.patch("/:id", validate(updatePostSchema), postsController.updatePost);
router.delete("/:id", postsController.deletePost);
router.post("/:id/reactions", postsController.toggleReaction);

export default router;
