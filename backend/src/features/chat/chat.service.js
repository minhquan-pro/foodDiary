import prisma from "../../utils/prisma.js";

const USER_SELECT = {
	id: true,
	name: true,
	avatarUrl: true,
};

/**
 * Get or create a 1-on-1 conversation between two users.
 */
export async function getOrCreateConversation(userId, otherUserId) {
	// Find existing conversation that has exactly these two members
	const existing = await prisma.conversation.findFirst({
		where: {
			AND: [{ members: { some: { userId } } }, { members: { some: { userId: otherUserId } } }],
		},
		include: {
			members: { include: { user: { select: USER_SELECT } } },
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				include: { sender: { select: USER_SELECT } },
			},
		},
	});

	if (existing) {
		return formatConversation(existing, userId);
	}

	// Create new conversation
	const conversation = await prisma.conversation.create({
		data: {
			members: {
				create: [{ userId }, { userId: otherUserId }],
			},
		},
		include: {
			members: { include: { user: { select: USER_SELECT } } },
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				include: { sender: { select: USER_SELECT } },
			},
		},
	});

	return formatConversation(conversation, userId);
}

/**
 * Get all conversations for a user.
 */
export async function getConversations(userId) {
	const conversations = await prisma.conversation.findMany({
		where: {
			members: { some: { userId } },
		},
		include: {
			members: { include: { user: { select: USER_SELECT } } },
			messages: {
				orderBy: { createdAt: "desc" },
				take: 1,
				include: { sender: { select: USER_SELECT } },
			},
			_count: {
				select: {
					messages: {
						where: {
							read: false,
							senderId: { not: userId },
						},
					},
				},
			},
		},
		orderBy: { updatedAt: "desc" },
	});

	return conversations.map((c) => formatConversation(c, userId));
}

/**
 * Get messages for a conversation (paginated).
 */
export async function getMessages(conversationId, userId, cursor, limit = 30) {
	// Verify user is a member
	const member = await prisma.conversationMember.findUnique({
		where: { conversationId_userId: { conversationId, userId } },
	});
	if (!member) return null;

	const where = { conversationId };
	if (cursor) {
		where.createdAt = { lt: new Date(cursor) };
	}

	const messages = await prisma.message.findMany({
		where,
		include: { sender: { select: USER_SELECT } },
		orderBy: { createdAt: "desc" },
		take: limit,
	});

	return messages.reverse();
}

/**
 * Create a new message.
 */
export async function createMessage(conversationId, senderId, body) {
	// Verify sender is a member
	const member = await prisma.conversationMember.findUnique({
		where: { conversationId_userId: { conversationId, userId: senderId } },
	});
	if (!member) return null;

	const message = await prisma.message.create({
		data: { body, conversationId, senderId },
		include: { sender: { select: USER_SELECT } },
	});

	// Update conversation's updatedAt
	await prisma.conversation.update({
		where: { id: conversationId },
		data: { updatedAt: new Date() },
	});

	return message;
}

/**
 * Mark all messages in a conversation as read (except own messages).
 */
export async function markAsRead(conversationId, userId) {
	await prisma.message.updateMany({
		where: {
			conversationId,
			senderId: { not: userId },
			read: false,
		},
		data: { read: true },
	});
}

/**
 * Get total unread message count for a user.
 */
export async function getUnreadCount(userId) {
	const count = await prisma.message.count({
		where: {
			conversation: {
				members: { some: { userId } },
			},
			senderId: { not: userId },
			read: false,
		},
	});
	return count;
}

// ─── Helpers ────────────────────────────────────────────────

function formatConversation(conv, currentUserId) {
	const otherMember = conv.members.find((m) => m.userId !== currentUserId);
	return {
		id: conv.id,
		otherUser: otherMember?.user || null,
		lastMessage: conv.messages[0] || null,
		unreadCount: conv._count?.messages || 0,
		updatedAt: conv.updatedAt,
		createdAt: conv.createdAt,
	};
}
