import { Router } from "express";
import authenticate from "../../middleware/authenticate.js";
import * as chatController from "./chat.controller.js";

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.startConversation);
router.post("/conversations/group", chatController.createGroupConversation);
router.delete("/conversations/:id", chatController.deleteConversation);
router.get("/conversations/:id/messages", chatController.getMessages);
router.post("/conversations/:id/messages", chatController.sendMessage);
router.patch("/conversations/:id/read", chatController.markAsRead);
router.patch("/conversations/:id/name", chatController.updateGroupName);
router.post("/conversations/:id/members", chatController.addGroupMembers);
router.delete("/conversations/:id/members/:userId", chatController.removeGroupMember);
router.post("/conversations/:id/messages/:messageId/react", chatController.toggleReaction);
router.get("/unread-count", chatController.getUnreadCount);

export default router;
