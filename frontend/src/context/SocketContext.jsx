import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
	const { token } = useSelector((state) => state.auth);
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState(new Set());
	const socketRef = useRef(null);

	useEffect(() => {
		if (!token) {
			// Disconnect if logged out
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
				setSocket(null);
				setOnlineUsers(new Set());
			}
			return;
		}

		// Connect socket
		const newSocket = io({
			auth: { token },
			transports: ["websocket", "polling"],
		});

		newSocket.on("connect", () => {
			console.log("🔌 Socket connected:", newSocket.id);
		});

		newSocket.on("connect_error", (err) => {
			console.error("Socket connection error:", err.message);
		});

		// Online / offline tracking
		newSocket.on("user:online", ({ userId }) => {
			setOnlineUsers((prev) => new Set([...prev, userId]));
		});

		newSocket.on("user:offline", ({ userId }) => {
			setOnlineUsers((prev) => {
				const next = new Set(prev);
				next.delete(userId);
				return next;
			});
		});

		socketRef.current = newSocket;
		setSocket(newSocket);

		return () => {
			newSocket.disconnect();
			socketRef.current = null;
		};
	}, [token]);

	const isUserOnline = (userId) => onlineUsers.has(userId);

	return <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>{children}</SocketContext.Provider>;
}

export function useSocket() {
	return useContext(SocketContext);
}
