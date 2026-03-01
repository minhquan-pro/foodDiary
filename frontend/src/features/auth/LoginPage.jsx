import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { loginUser, clearAuthError } from "./authSlice.js";
import { FiMail, FiLock } from "react-icons/fi";

export default function LoginPage() {
	const dispatch = useDispatch();
	const { user, loading, error } = useSelector((state) => state.auth);

	const [form, setForm] = useState({ email: "", password: "" });

	if (user) return <Navigate to="/" replace />;

	const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	const handleSubmit = (e) => {
		e.preventDefault();
		dispatch(clearAuthError());
		dispatch(loginUser(form));
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - decorative */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-orange-500 relative overflow-hidden">
				<div className="absolute inset-0 bg-black/10" />
				<div className="relative z-10 flex flex-col justify-center px-16 text-white">
					<h2 className="text-4xl font-extrabold leading-tight">
						Welcome back to
						<br />
						FoodShare
					</h2>
					<p className="mt-4 text-lg text-white/80 max-w-md">
						Discover amazing restaurants, share your food experiences, and connect with fellow food lovers.
					</p>
					<div className="mt-8 flex gap-6 text-sm text-white/60">
						<div>
							<strong className="text-white text-2xl block">10K+</strong>Reviews
						</div>
						<div>
							<strong className="text-white text-2xl block">5K+</strong>Users
						</div>
						<div>
							<strong className="text-white text-2xl block">2K+</strong>Restaurants
						</div>
					</div>
				</div>
				{/* Decorative circles */}
				<div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5" />
				<div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
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

					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign in</h1>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
						Enter your credentials to access your account
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
								placeholder="••••••••"
								required
							/>
						</div>
						<button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
							{loading ? "Signing in…" : "Sign In"}
						</button>
					</form>

					<p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
						Don&apos;t have an account?{" "}
						<Link
							to="/register"
							className="font-semibold text-primary-600 hover:text-primary-700 hover:underline"
						>
							Create one free
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
