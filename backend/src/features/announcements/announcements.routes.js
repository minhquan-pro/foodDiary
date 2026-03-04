import { Router } from "express";
import authenticate from "../../middleware/authenticate.js";
import upload from "../../utils/upload.js";
import * as announcementsController from "./announcements.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", announcementsController.getAnnouncements);
router.post("/", upload.single("image"), announcementsController.createAnnouncement);
router.delete("/:id", announcementsController.deleteAnnouncement);

export default router;
