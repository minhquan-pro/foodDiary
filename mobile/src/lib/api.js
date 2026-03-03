import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host machine's localhost
// iOS simulator uses localhost
// Physical device needs the actual IP address of your machine
const getServerUrl = () => {
	if (__DEV__) {
		if (Platform.OS === "web") {
			return "http://localhost:4000";
		}
		// Physical device (Android/iOS): use host machine's actual IP
		return "http://172.17.37.97:4000";
	}
	return "https://your-production-url.com";
};

const SERVER_URL = getServerUrl();

const getBaseUrl = () => `${SERVER_URL}/api`;

/**
 * Convert a relative image path (e.g. /uploads/xxx.jpg) to a full URL
 * that React Native Image can load.
 */
export const getImageUrl = (path) => {
	if (!path) return null;
	if (path.startsWith("http")) return path; // already absolute
	return `${SERVER_URL}${path}`;
};

const api = axios.create({
	baseURL: getBaseUrl(),
	timeout: 15000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(async (config) => {
	const token = await AsyncStorage.getItem("token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response?.status === 401) {
			await AsyncStorage.removeItem("token");
			// Navigation will be handled by auth state change
		}
		const message = error.response?.data?.message || error.message || "Something went wrong";
		return Promise.reject(new Error(message));
	},
);

export default api;
