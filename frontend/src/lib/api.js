import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "/api",
	headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach JWT token ───────────────────
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		// Let browser set Content-Type automatically for FormData (multipart/form-data + boundary)
		if (config.data instanceof FormData) {
			delete config.headers["Content-Type"];
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// ─── Response interceptor: normalize errors ──────────────────
api.interceptors.response.use(
	(response) => response,
	(error) => {
		// If 401, clear token and redirect to login
		if (error.response?.status === 401) {
			localStorage.removeItem("token");
			// Only redirect if not already on an auth page
			if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
				window.location.href = "/login";
			}
		}

		const message = error.response?.data?.message || error.message || "Something went wrong";
		return Promise.reject({ message, status: error.response?.status, errors: error.response?.data?.errors });
	},
);

export default api;
