import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addMessage, incrementUnread, updateMessageReactions } from "../features/chat/chatSlice";
import { addNotification } from "../features/notifications/notificationsSlice";

const SocketContext = createContext(null);

const getSocketUrl = () => {
	if (__DEV__) {
		if (Platform.OS === "android") {
			return "http://10.0.2.2:4000";
		}
		return "http://localhost:4000";
	}
	return "https://your-production-url.com";
};

export function SocketProvider({ children }) {
	const { user, token } = useSelector((state) => state.auth);
	const dispatch = useDispatch();
	const socketRef = useRef(null);
	const [onlineUsers, setOnlineUsers] = useState(new Set());

	useEffect(() => {
		if (!user || !token) {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
			return;
		}

		const socket = io(getSocketUrl(), {
			auth: { token },
			transports: ["websocket"],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 2000,
		});

		socketRef.current = socket;

		socket.on("connect", () => {
			console.log("Socket connected");
		});

		socket.on("user:online", (userId) => {
			setOnlineUsers((prev) => new Set([...prev, userId]));
		});

		socket.on("user:offline", (userId) => {
			setOnlineUsers((prev) => {
				const next = new Set(prev);
				next.delete(userId);
				return next;
			});
		});

		socket.on("chat:newMessage", (data) => {
			const { conversationId, message } = data;
			dispatch(addMessage({ conversationId, message }));
			if (message.senderId !== user.id) {
				dispatch(incrementUnread({ conversationId }));
			}
		});

		socket.on("chat:messageReactionUpdated", (data) => {
			dispatch(updateMessageReactions(data));
		});

		socket.on("notification:new", (notification) => {
			dispatch(addNotification(notification));
		});

		socket.on("disconnect", () => {
			console.log("Socket disconnected");
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [user, token, dispatch]);

	return (
		<SocketContext.Provider value={{ socket: socketRef.current, onlineUsers }}>{children}</SocketContext.Provider>
	);
}

export function useSocket() {
	return useContext(SocketContext);
}

export default SocketContext;
