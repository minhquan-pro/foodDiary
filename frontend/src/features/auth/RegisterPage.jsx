import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { registerUser, clearAuthError } from "./authSlice.js";
import { FiUser, FiMail, FiLock } from "react-icons/fi";

export default function RegisterPage() {
	const dispatch = useDispatch();
	const { user, loading, error } = useSelector((state) => state.auth);

	const [form, setForm] = useState({ name: "", email: "", password: "" });

	if (user) return <Navigate to="/" replace />;

	const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	const handleSubmit = (e) => {
		e.preventDefault();
		dispatch(clearAuthError());
		dispatch(registerUser(form));
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - decorative */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-primary-500 to-primary-600 relative overflow-hidden">
				<div className="absolute inset-0 bg-black/10" />
				<div className="relative z-10 flex flex-col justify-center px-16 text-white">
					<span className="text-5xl mb-6">✨</span>
					<h2 className="text-4xl font-extrabold leading-tight">
						Join the
						<br />
						FoodShare Community
					</h2>
					<p className="mt-4 text-lg text-white/80 max-w-md">
						Create your free account and start sharing your culinary experiences with food enthusiasts
						worldwide.
					</p>
					<div className="mt-8 space-y-3 text-sm text-white/70">
						<div className="flex items-center gap-3">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
								✓
							</span>{" "}
							Share unlimited food reviews
						</div>
						<div className="flex items-center gap-3">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
								✓
							</span>{" "}
							Follow your favorite reviewers
						</div>
						<div className="flex items-center gap-3">
							<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">
								✓
							</span>{" "}
							Discover hidden gem restaurants
						</div>
					</div>
				</div>
				<div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5" />
				<div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
			</div>

			{/* Right side - form */}
			<div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 dark:bg-gray-900">
				<div className="w-full max-w-md animate-fade-in">
					<div className="lg:hidden mb-8 text-center">
						<span className="text-4xl">🍽️</span>
						<h1 className="mt-2 text-2xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
							FoodShare
						</h1>
					</div>

					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Fill in the details below to get started
					</p>

					{error && (
						<div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
							<span className="shrink-0">⚠️</span>
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="mt-6 space-y-5">
						<div>
							<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
								<FiUser size={14} className="text-gray-400 dark:text-gray-500" />
								Full Name
							</label>
							<input
								type="text"
								name="name"
								value={form.name}
								onChange={handleChange}
								className="input"
								placeholder="John Doe"
								required
							/>
						</div>
						<div>
							<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
								<FiMail size={14} className="text-gray-400 dark:text-gray-500" />
								Email
							</label>
							<input
								type="email"
								name="email"
								value={form.email}
								onChange={handleChange}
								className="input"
								placeholder="you@example.com"
								required
							/>
						</div>
						<div>
							<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
								<FiLock size={14} className="text-gray-400 dark:text-gray-500" />
								Password
							</label>
							<input
								type="password"
								name="password"
								value={form.password}
								onChange={handleChange}
								className="input"
								placeholder="Min 6 characters"
								minLength={6}
								required
							/>
						</div>
						<button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
							{loading ? "Creating account…" : "Create Account"}
						</button>
					</form>

					<p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
						Already have an account?{" "}
						<Link
							to="/login"
							className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
