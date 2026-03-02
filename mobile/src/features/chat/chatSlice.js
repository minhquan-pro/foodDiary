import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

// ─── Async Thunks ────────────────────────────────────────────

export const fetchConversations = createAsyncThunk("chat/fetchConversations", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/chat/conversations");
		return data.data.conversations;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const startConversation = createAsyncThunk("chat/startConversation", async (userId, { rejectWithValue }) => {
	try {
		const { data } = await api.post("/chat/conversations", { userId });
		return data.data.conversation;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const createGroupConversation = createAsyncThunk(
	"chat/createGroupConversation",
	async ({ memberIds, name }, { rejectWithValue }) => {
		try {
			const { data } = await api.post("/chat/conversations/group", {
				memberIds,
				name,
			});
			return data.data.conversation;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const fetchMessages = createAsyncThunk(
	"chat/fetchMessages",
	async ({ conversationId, cursor }, { rejectWithValue }) => {
		try {
			const params = cursor ? `?cursor=${cursor}&limit=30` : "?limit=30";
			const { data } = await api.get(`/chat/conversations/${conversationId}/messages${params}`);
			return {
				conversationId,
				messages: data.data.messages,
				prepend: !!cursor,
			};
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

export const fetchUnreadCount = createAsyncThunk("chat/fetchUnreadCount", async (_, { rejectWithValue }) => {
	try {
		const { data } = await api.get("/chat/unread-count");
		return data.data.count;
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

export const deleteConversation = createAsyncThunk(
	"chat/deleteConversation",
	async (conversationId, { rejectWithValue }) => {
		try {
			await api.delete(`/chat/conversations/${conversationId}`);
			return conversationId;
		} catch (err) {
			return rejectWithValue(err.message);
		}
	},
);

// ─── Slice ───────────────────────────────────────────────────

const initialState = {
	conversations: [],
	activeConversationId: null,
	messages: {},
	unreadCount: 0,
	loading: false,
	messagesLoading: false,
	error: null,
};

const chatSlice = createSlice({
	name: "chat",
	initialState,
	reducers: {
		setActiveConversation(state, action) {
			state.activeConversationId = action.payload;
		},
		clearActiveConversation(state) {
			state.activeConversationId = null;
		},
		addMessage(state, action) {
			const { conversationId, message } = action.payload;
			if (!state.messages[conversationId]) {
				state.messages[conversationId] = [];
			}
			const exists = state.messages[conversationId].some((m) => m.id === message.id);
			if (!exists) {
				state.messages[conversationId].push(message);
			}
			const conv = state.conversations.find((c) => c.id === conversationId);
			if (conv) {
				conv.lastMessage = message;
				conv.updatedAt = message.createdAt;
			}
			state.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
		},
		incrementUnread(state, action) {
			const { conversationId } = action.payload;
			if (conversationId !== state.activeConversationId) {
				state.unreadCount += 1;
				const conv = state.conversations.find((c) => c.id === conversationId);
				if (conv) conv.unreadCount = (conv.unreadCount || 0) + 1;
			}
		},
		clearConversationUnread(state, action) {
			const conversationId = action.payload;
			const conv = state.conversations.find((c) => c.id === conversationId);
			if (conv) {
				state.unreadCount = Math.max(0, state.unreadCount - (conv.unreadCount || 0));
				conv.unreadCount = 0;
			}
		},
		resetChat() {
			return initialState;
		},
		updateMessageReactions(state, action) {
			const { conversationId, message } = action.payload;
			const msgs = state.messages[conversationId];
			if (msgs) {
				const idx = msgs.findIndex((m) => m.id === message.id);
				if (idx !== -1) {
					msgs[idx] = { ...msgs[idx], reactions: message.reactions };
				}
			}
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchConversations.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchConversations.fulfilled, (state, action) => {
				state.loading = false;
				state.conversations = action.payload;
			})
			.addCase(fetchConversations.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload;
			});

		builder.addCase(startConversation.fulfilled, (state, action) => {
			const exists = state.conversations.find((c) => c.id === action.payload.id);
			if (!exists) {
				state.conversations.unshift(action.payload);
			}
			state.activeConversationId = action.payload.id;
		});

		builder.addCase(createGroupConversation.fulfilled, (state, action) => {
			state.conversations.unshift(action.payload);
			state.activeConversationId = action.payload.id;
		});

		builder
			.addCase(fetchMessages.pending, (state) => {
				state.messagesLoading = true;
			})
			.addCase(fetchMessages.fulfilled, (state, action) => {
				state.messagesLoading = false;
				const { conversationId, messages, prepend } = action.payload;
				if (prepend && state.messages[conversationId]) {
					state.messages[conversationId] = [...messages, ...state.messages[conversationId]];
				} else {
					state.messages[conversationId] = messages;
				}
			})
			.addCase(fetchMessages.rejected, (state) => {
				state.messagesLoading = false;
			});

		builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
			state.unreadCount = action.payload;
		});

		builder.addCase(deleteConversation.fulfilled, (state, action) => {
			const id = action.payload;
			const conv = state.conversations.find((c) => c.id === id);
			if (conv) {
				state.unreadCount = Math.max(0, state.unreadCount - (conv.unreadCount || 0));
			}
			state.conversations = state.conversations.filter((c) => c.id !== id);
			delete state.messages[id];
			if (state.activeConversationId === id) {
				state.activeConversationId = null;
			}
		});
	},
});

export const {
	setActiveConversation,
	clearActiveConversation,
	addMessage,
	incrementUnread,
	clearConversationUnread,
	resetChat,
	updateMessageReactions,
} = chatSlice.actions;
export default chatSlice.reducer;
