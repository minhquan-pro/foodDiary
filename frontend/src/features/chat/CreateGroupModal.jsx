import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiX, FiSearch, FiUsers, FiCheck } from "react-icons/fi";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import api from "../../lib/api.js";
import { createGroupConversation } from "./chatSlice.js";
import toast from "react-hot-toast";

export default function CreateGroupModal({ isOpen, onClose, onCreated }) {
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);

	const [groupName, setGroupName] = useState("");
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [creating, setCreating] = useState(false);
	const [closing, setClosing] = useState(false);

	const debounceRef = useRef(null);
	const inputRef = useRef(null);

	// Reset on open
	useEffect(() => {
		if (isOpen) {
			setGroupName("");
			setSearch("");
			setSearchResults([]);
			setSelectedUsers([]);
			setCreating(false);
			setClosing(false);
			setTimeout(() => inputRef.current?.focus(), 200);
		}
	}, [isOpen]);

	// Debounced user search
	useEffect(() => {
		if (!search.trim()) {
			setSearchResults([]);
			return;
		}

		setSearchLoading(true);
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			try {
				const { data } = await api.get(`/users?q=${encodeURIComponent(search.trim())}&limit=10`);
				// Filter out current user and already selected users
				const users = (data.data.users || []).filter(
					(u) => u.id !== currentUser?.id && !selectedUsers.some((s) => s.id === u.id),
				);
				setSearchResults(users);
			} catch {
				setSearchResults([]);
			} finally {
				setSearchLoading(false);
			}
		}, 300);

		return () => clearTimeout(debounceRef.current);
	}, [search, currentUser?.id, selectedUsers]);

	const handleClose = () => {
		if (creating) return;
		setClosing(true);
		setTimeout(() => {
			setClosing(false);
			onClose();
		}, 200);
	};

	const toggleUser = (user) => {
		setSelectedUsers((prev) => {
			const exists = prev.some((u) => u.id === user.id);
			if (exists) return prev.filter((u) => u.id !== user.id);
			return [...prev, user];
		});
		setSearch("");
		setSearchResults([]);
	};

	const removeUser = (userId) => {
		setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
	};

	const handleCreate = async () => {
		if (selectedUsers.length < 2) {
			return toast.error("Please select at least 2 members");
		}

		setCreating(true);
		const result = await dispatch(
			createGroupConversation({
				memberIds: selectedUsers.map((u) => u.id),
				name: groupName.trim() || undefined,
			}),
		);

		if (createGroupConversation.fulfilled.match(result)) {
			toast.success("Group chat created!");
			onCreated?.(result.payload.id);
			handleClose();
		} else {
			toast.error(result.payload || "Failed to create group");
		}
		setCreating(false);
	};

	if (!isOpen) return null;

	return (
		<div
			className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-all duration-200 ${closing ? "opacity-0" : "opacity-100"}`}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

			{/* Modal */}
			<div
				className={`relative w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 transition-all duration-200 ${
					closing ? "scale-95 opacity-0" : "scale-100 opacity-100"
				}`}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-700">
					<div className="flex items-center gap-2">
						<FiUsers size={18} className="text-violet-500" />
						<h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">New Group Chat</h2>
					</div>
					<button
						onClick={handleClose}
						disabled={creating}
						className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-700 dark:hover:text-gray-300"
					>
						<FiX size={18} />
					</button>
				</div>

				<div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(80vh - 140px)" }}>
					{/* Group name input */}
					<div>
						<label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
							Group Name <span className="text-gray-400 font-normal">(optional)</span>
						</label>
						<input
							ref={inputRef}
							type="text"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							placeholder="Enter group name..."
							className="input !text-sm"
							maxLength={50}
						/>
					</div>

					{/* Selected members */}
					{selectedUsers.length > 0 && (
						<div>
							<p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
								Members ({selectedUsers.length + 1})
							</p>
							<div className="flex flex-wrap gap-2">
								{/* Current user (non-removable) */}
								<div className="flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-sm dark:bg-sky-900/30">
									<span className="text-sky-700 dark:text-sky-300 font-medium">You</span>
								</div>
								{selectedUsers.map((user) => (
									<div
										key={user.id}
										className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-700"
									>
										{user.avatarUrl ? (
											<img
												src={user.avatarUrl}
												alt={user.name}
												className="h-5 w-5 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-sky-200 text-[10px] font-bold text-sky-600 dark:from-sky-800 dark:to-sky-700 dark:text-sky-300">
												{user.name.charAt(0).toUpperCase()}
											</div>
										)}
										<span className="text-gray-700 dark:text-gray-300 font-medium">
											{user.name}
										</span>
										<button
											onClick={() => removeUser(user.id)}
											className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
										>
											<FiX size={14} />
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Search users */}
					<div>
						<label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
							Add Members
						</label>
						<div className="relative">
							<FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search users to add..."
								className="input pl-9 !text-sm"
							/>
						</div>
					</div>

					{/* Search results */}
					{searchLoading && (
						<div className="flex justify-center py-4">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-sky-400" />
						</div>
					)}

					{!searchLoading && searchResults.length > 0 && (
						<div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
							{searchResults.map((user) => {
								const isSelected = selectedUsers.some((u) => u.id === user.id);
								return (
									<button
										key={user.id}
										onClick={() => toggleUser(user)}
										className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
											isSelected
												? "bg-sky-50 dark:bg-sky-900/20"
												: "hover:bg-gray-50 dark:hover:bg-gray-700/40"
										}`}
									>
										{user.avatarUrl ? (
											<img
												src={user.avatarUrl}
												alt={user.name}
												className="h-9 w-9 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-50 to-sky-100 text-sm font-bold text-sky-600 dark:from-sky-900/50 dark:to-sky-800/50 dark:text-sky-400">
												{user.name.charAt(0).toUpperCase()}
											</div>
										)}
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-1">
												<p className="text-sm font-semibold text-gray-800 truncate dark:text-gray-200">
													{user.name}
												</p>
												<VerifiedBadge role={user.role} size={14} />
											</div>
											{user.email && (
												<p className="text-xs text-gray-400 truncate dark:text-gray-500">
													{user.email}
												</p>
											)}
										</div>
										{isSelected && <FiCheck size={18} className="text-sky-500 shrink-0" />}
									</button>
								);
							})}
						</div>
					)}

					{!searchLoading && search.trim() && searchResults.length === 0 && (
						<p className="text-center text-sm text-gray-400 py-4 dark:text-gray-500">
							No users found for "{search}"
						</p>
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
					<button
						onClick={handleCreate}
						disabled={creating || selectedUsers.length < 2}
						className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{creating ? (
							<span className="flex items-center justify-center gap-2">
								<svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
										fill="none"
									/>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								Creating...
							</span>
						) : (
							`Create Group (${selectedUsers.length + 1} members)`
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
