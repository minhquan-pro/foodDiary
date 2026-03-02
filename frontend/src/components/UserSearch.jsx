import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import VerifiedBadge from "./VerifiedBadge.jsx";
import api from "../lib/api.js";

export default function UserSearch() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef(null);
	const inputRef = useRef(null);
	const debounceRef = useRef(null);

	// Debounced search
	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setOpen(false);
			return;
		}

		setLoading(true);
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			try {
				const { data } = await api.get(`/users?q=${encodeURIComponent(query.trim())}&limit=8`);
				setResults(data.data.users || []);
				setOpen(true);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);

		return () => clearTimeout(debounceRef.current);
	}, [query]);

	// Close on outside click
	useEffect(() => {
		const handler = (e) => {
			if (containerRef.current && !containerRef.current.contains(e.target)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const handleClear = () => {
		setQuery("");
		setResults([]);
		setOpen(false);
		inputRef.current?.focus();
	};

	return (
		<div ref={containerRef} className="relative">
			{/* Search input */}
			<div className="relative flex items-center">
				<FiSearch size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
					placeholder="Search users..."
					className="w-44 sm:w-56 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all duration-200 focus:w-56 sm:focus:w-72 focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-primary-600 dark:focus:bg-gray-800 dark:focus:ring-primary-900/30"
				/>
				{query && (
					<button
						onClick={handleClear}
						className="absolute right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					>
						<FiX size={14} />
					</button>
				)}
			</div>

			{/* Dropdown results */}
			{open && (
				<div className="absolute left-0 top-11 z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl animate-fade-in dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-500" />
						</div>
					) : results.length === 0 ? (
						<div className="py-8 text-center">
							<FiSearch size={24} className="mx-auto text-gray-200 mb-2 dark:text-gray-600" />
							<p className="text-sm text-gray-400 dark:text-gray-500">
								No users found for "{query}"
							</p>
						</div>
					) : (
						<div className="py-1">
							<p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">
								Users
							</p>
							{results.map((user) => (
								<Link
									key={user.id}
									to={`/profile/${user.id}`}
									onClick={() => {
										setOpen(false);
										setQuery("");
									}}
									className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors dark:hover:bg-gray-700/50"
								>
									{user.avatarUrl ? (
										<img
											src={user.avatarUrl}
											alt={user.name}
											className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
										/>
									) : (
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-sm font-bold text-primary-700 dark:from-primary-900/50 dark:to-primary-800/50 dark:text-primary-400">
											{user.name.charAt(0).toUpperCase()}
										</div>
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
											{user.name}
											<VerifiedBadge role={user.role} size={14} className="ml-1" />
										</p>
										{user.bio && (
											<p className="text-xs text-gray-400 truncate dark:text-gray-500">{user.bio}</p>
										)}
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
