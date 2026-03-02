import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPost } from "../features/posts/postsSlice.js";
import { addOptimisticPost, removeOptimisticPost } from "../features/feed/feedSlice.js";
import StarRating from "./StarRating.jsx";
import toast from "react-hot-toast";
import { FiX, FiUpload, FiCamera, FiMapPin, FiStar, FiFileText, FiImage, FiTrash2, FiLoader } from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";

export default function CreatePostModal({ isOpen, onClose }) {
	const dispatch = useDispatch();
	const { loading } = useSelector((state) => state.posts);
	const { user: currentUser } = useSelector((state) => state.auth);
	const overlayRef = useRef(null);
	const firstInputRef = useRef(null);

	const [form, setForm] = useState({
		restaurantName: "",
		restaurantAddress: "",
		rating: 0,
		description: "",
	});
	const [image, setImage] = useState(null);
	const [preview, setPreview] = useState(null);
	const [dragOver, setDragOver] = useState(false);
	const [closing, setClosing] = useState(false);
	const [step, setStep] = useState(1); // 1 = image, 2 = details

	// Address suggestion state
	const [addressSuggestions, setAddressSuggestions] = useState([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [locating, setLocating] = useState(false);
	const addressDebounceRef = useRef(null);
	const addressInputRef = useRef(null);
	const suggestionsRef = useRef(null);

	// Restaurant name suggestion state
	const [nameSuggestions, setNameSuggestions] = useState([]);
	const [showNameSuggestions, setShowNameSuggestions] = useState(false);
	const nameDebounceRef = useRef(null);
	const nameInputRef = useRef(null);
	const nameSuggestionsRef = useRef(null);

	// Reset on open
	useEffect(() => {
		if (isOpen) {
			setForm({ restaurantName: "", restaurantAddress: "", rating: 0, description: "" });
			setImage(null);
			setPreview(null);
			setDragOver(false);
			setClosing(false);
			setStep(1);
			setAddressSuggestions([]);
			setShowSuggestions(false);
			setLocating(false);
			setNameSuggestions([]);
			setShowNameSuggestions(false);
		}
	}, [isOpen]);

	// Block background scroll while modal is open
	useEffect(() => {
		if (!isOpen) return;
		const prevent = (e) => {
			// Allow scroll inside the modal content
			if (overlayRef.current) {
				const modal = overlayRef.current.querySelector("[data-modal-body]");
				if (modal && modal.contains(e.target)) return;
			}
			e.preventDefault();
		};
		window.addEventListener("wheel", prevent, { passive: false });
		window.addEventListener("touchmove", prevent, { passive: false });
		return () => {
			window.removeEventListener("wheel", prevent);
			window.removeEventListener("touchmove", prevent);
		};
	}, [isOpen]);

	// Focus first input on step 2
	useEffect(() => {
		if (step === 2 && firstInputRef.current) {
			setTimeout(() => firstInputRef.current.focus(), 200);
		}
	}, [step]);

	// Escape key
	useEffect(() => {
		const handleEsc = (e) => {
			if (e.key === "Escape" && isOpen && !loading) handleClose();
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [isOpen, loading]);

	const handleClose = useCallback(() => {
		if (loading) return;
		setClosing(true);
		setTimeout(() => {
			setClosing(false);
			onClose();
		}, 250);
	}, [loading, onClose]);

	const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	// ─── Restaurant name autocomplete via Nominatim ───────────
	const handleNameChange = (e) => {
		const value = e.target.value;
		setForm((prev) => ({ ...prev, restaurantName: value }));

		clearTimeout(nameDebounceRef.current);
		if (!value.trim() || value.length < 2) {
			setNameSuggestions([]);
			setShowNameSuggestions(false);
			return;
		}
		nameDebounceRef.current = setTimeout(async () => {
			try {
				const query = encodeURIComponent(value.trim());
				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=8&addressdetails=1&extratags=1&namedetails=1`,
					{ headers: { "Accept-Language": "vi,en" } },
				);
				const data = await res.json();
				// Filter for food-related places
				const foodTypes = [
					"restaurant",
					"cafe",
					"fast_food",
					"bar",
					"pub",
					"food_court",
					"bakery",
					"ice_cream",
				];
				const places = data
					.filter(
						(p) =>
							foodTypes.includes(p.extratags?.amenity) ||
							foodTypes.includes(p.type) ||
							p.class === "amenity",
					)
					.map((p) => ({
						name: p.namedetails?.["name:vi"] || p.namedetails?.name || p.display_name.split(",")[0],
						address: p.display_name,
						lat: p.lat,
						lon: p.lon,
					}));
				// If no food-specific results, show general results with names
				const results =
					places.length > 0
						? places
						: data.slice(0, 6).map((p) => ({
								name: p.namedetails?.["name:vi"] || p.namedetails?.name || p.display_name.split(",")[0],
								address: p.display_name,
								lat: p.lat,
								lon: p.lon,
							}));
				setNameSuggestions(results);
				setShowNameSuggestions(results.length > 0);
			} catch {
				setNameSuggestions([]);
				setShowNameSuggestions(false);
			}
		}, 400);
	};

	const selectNameSuggestion = (place) => {
		setForm((prev) => ({
			...prev,
			restaurantName: place.name,
			restaurantAddress: place.address,
		}));
		setNameSuggestions([]);
		setShowNameSuggestions(false);
	};

	// Close name suggestions on outside click
	useEffect(() => {
		const handler = (e) => {
			if (
				nameSuggestionsRef.current &&
				!nameSuggestionsRef.current.contains(e.target) &&
				nameInputRef.current &&
				!nameInputRef.current.contains(e.target)
			) {
				setShowNameSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	// ─── Address autocomplete via Nominatim ────────────────────
	const searchAddress = useCallback(async (query) => {
		if (!query || query.length < 3) {
			setAddressSuggestions([]);
			setShowSuggestions(false);
			return;
		}
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
				{ headers: { "Accept-Language": "vi,en" } },
			);
			const data = await res.json();
			setAddressSuggestions(data);
			setShowSuggestions(data.length > 0);
		} catch {
			setAddressSuggestions([]);
		}
	}, []);

	const handleAddressChange = (e) => {
		const value = e.target.value;
		setForm((prev) => ({ ...prev, restaurantAddress: value }));

		// Debounce API call
		if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
		addressDebounceRef.current = setTimeout(() => searchAddress(value), 400);
	};

	const handleSelectSuggestion = (suggestion) => {
		setForm((prev) => ({ ...prev, restaurantAddress: suggestion.display_name }));
		setShowSuggestions(false);
		setAddressSuggestions([]);
	};

	// Close suggestions on outside click
	useEffect(() => {
		const handler = (e) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(e.target) &&
				addressInputRef.current &&
				!addressInputRef.current.contains(e.target)
			) {
				setShowSuggestions(false);
			}
		};
		if (showSuggestions) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [showSuggestions]);

	// ─── Geolocation: detect current location ─────────────────
	const handleGetLocation = () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not supported by your browser");
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			async (position) => {
				try {
					const { latitude, longitude } = position.coords;
					const res = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
						{ headers: { "Accept-Language": "vi,en" } },
					);
					const data = await res.json();
					if (data.display_name) {
						setForm((prev) => ({ ...prev, restaurantAddress: data.display_name }));
						toast.success("Location detected!");
					} else {
						toast.error("Could not determine address");
					}
				} catch {
					toast.error("Failed to get address from location");
				} finally {
					setLocating(false);
				}
			},
			(err) => {
				setLocating(false);
				if (err.code === err.PERMISSION_DENIED) {
					toast.error("Location access denied. Please allow location in your browser settings.");
				} else {
					toast.error("Could not get your location");
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 },
		);
	};

	const processFile = (file) => {
		if (file && file.type.startsWith("image/")) {
			setImage(file);
			setPreview(URL.createObjectURL(file));
		} else {
			toast.error("Please select a valid image file");
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) processFile(file);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		const file = e.dataTransfer.files[0];
		if (file) processFile(file);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragOver(true);
	};

	const handleDragLeave = () => setDragOver(false);

	const removeImage = () => {
		setImage(null);
		setPreview(null);
	};

	const handleNextStep = () => {
		if (!image) return toast.error("Please upload a food photo first");
		setStep(2);
	};

	const handlePrevStep = () => setStep(1);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!image) return toast.error("Please upload a food photo");
		if (form.rating === 0) return toast.error("Please select a rating");

		// Build optimistic post
		const tempId = `temp-${Date.now()}`;
		const optimisticPost = {
			id: tempId,
			imageUrl: URL.createObjectURL(image),
			restaurantName: form.restaurantName,
			restaurantAddress: form.restaurantAddress,
			rating: Number(form.rating),
			description: form.description,
			createdAt: new Date().toISOString(),
			slug: tempId,
			user: {
				id: currentUser.id,
				name: currentUser.name,
				avatarUrl: currentUser.avatarUrl || null,
				role: currentUser.role || "USER",
			},
			_count: { likes: 0, comments: 0 },
		};

		// Optimistically add to feed & close modal immediately
		dispatch(addOptimisticPost(optimisticPost));
		handleClose();
		toast.success("Review published successfully! 🎉");

		const formData = new FormData();
		formData.append("image", image);
		formData.append("restaurantName", form.restaurantName);
		formData.append("restaurantAddress", form.restaurantAddress);
		formData.append("rating", form.rating);
		formData.append("description", form.description);

		const result = await dispatch(createPost(formData));
		if (createPost.rejected.match(result)) {
			dispatch(removeOptimisticPost(tempId));
			toast.error(result.payload || "Failed to create post");
		}
	};

	if (!isOpen) return null;

	const charCount = form.description.length;
	const progress = step === 1 ? 50 : 100;

	return (
		<div
			ref={overlayRef}
			className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 overscroll-none ${
				closing ? "opacity-0" : "opacity-100"
			}`}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

			{/* Modal */}
			<div
				className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 transition-all duration-300 ${
					closing ? "scale-95 translate-y-4 opacity-0" : "scale-100 translate-y-0 opacity-100"
				}`}
			>
				{/* Progress bar */}
				<div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800 z-10">
					<div
						className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500 ease-out rounded-r-full"
						style={{ width: `${progress}%` }}
					/>
				</div>

				{/* Header */}
				<div className="flex items-center justify-between px-6 pt-6 pb-4">
					<div>
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Review</h2>
						<p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
							{step === 1
								? "Step 1 — Upload your food photo"
								: "Step 2 — Add details about your experience"}
						</p>
					</div>
					<button
						onClick={handleClose}
						disabled={loading}
						className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-all duration-200"
					>
						<FiX size={20} />
					</button>
				</div>

				{/* Body */}
				<div data-modal-body className="overflow-y-auto px-6 pb-6" style={{ maxHeight: "calc(90vh - 140px)" }}>
					{/* Step 1: Image Upload */}
					{step === 1 && (
						<div className="animate-fade-in">
							<label
								className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-300 ${
									dragOver
										? "border-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]"
										: preview
											? "border-transparent"
											: "border-gray-200 bg-gray-50/50 hover:border-primary-300 hover:bg-primary-50/30 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-primary-900/10"
								}`}
								style={{ minHeight: "320px" }}
								onDrop={handleDrop}
								onDragOver={handleDragOver}
								onDragLeave={handleDragLeave}
							>
								{preview ? (
									<div className="relative w-full group">
										<img
											src={preview}
											alt="Preview"
											className="w-full rounded-2xl object-cover"
											style={{ maxHeight: "400px" }}
										/>
										{/* Overlay on hover */}
										<div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
											<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-3">
												<span className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-sm">
													<FiImage size={16} />
													Change photo
												</span>
											</div>
										</div>
									</div>
								) : (
									<div className="text-center p-10">
										<div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10">
											<FiCamera className="text-primary-500" size={36} />
										</div>
										<p className="text-base font-semibold text-gray-700 dark:text-gray-300">
											Drop your photo here
										</p>
										<p className="mt-1.5 text-sm text-gray-400 dark:text-gray-500">
											or click to browse · PNG, JPG up to 10MB
										</p>
									</div>
								)}
								<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
							</label>

							{/* Remove image button */}
							{preview && (
								<div className="mt-3 flex justify-center">
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											removeImage();
										}}
										className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
									>
										<FiTrash2 size={15} />
										Remove photo
									</button>
								</div>
							)}

							{/* Next button */}
							<button type="button" onClick={handleNextStep} className="btn-primary w-full btn-lg mt-5">
								Continue
							</button>
						</div>
					)}

					{/* Step 2: Details */}
					{step === 2 && (
						<form onSubmit={handleSubmit} className="animate-fade-in">
							{/* Image thumbnail */}
							{preview && (
								<div className="mb-5 flex items-center gap-4 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/50">
									<img
										src={preview}
										alt="Selected"
										className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
											{image?.name}
										</p>
										<p className="text-xs text-gray-400 dark:text-gray-500">
											{(image?.size / 1024 / 1024).toFixed(2)} MB
										</p>
									</div>
									<button
										type="button"
										onClick={handlePrevStep}
										className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0"
									>
										Change
									</button>
								</div>
							)}

							<div className="space-y-5">
								{/* Restaurant Name */}
								<div className="relative">
									<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
										<FiFileText size={15} className="text-primary-500" />
										Restaurant Name
									</label>
									<input
										ref={(el) => {
											firstInputRef.current = el;
											nameInputRef.current = el;
										}}
										type="text"
										name="restaurantName"
										value={form.restaurantName}
										onChange={handleNameChange}
										onFocus={() => nameSuggestions.length > 0 && setShowNameSuggestions(true)}
										className="input"
										placeholder="e.g. The Italian Corner"
										autoComplete="off"
										required
									/>
									{showNameSuggestions && nameSuggestions.length > 0 && (
										<div
											ref={nameSuggestionsRef}
											className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
										>
											{nameSuggestions.map((place, i) => (
												<button
													key={i}
													type="button"
													onClick={() => selectNameSuggestion(place)}
													className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors dark:hover:bg-gray-700"
												>
													<FiMapPin size={14} className="shrink-0 text-primary-400 mt-0.5" />
													<div className="min-w-0 flex-1">
														<p className="text-sm font-medium text-gray-800 truncate dark:text-gray-200">
															{place.name}
														</p>
														<p className="text-xs text-gray-400 truncate dark:text-gray-500">
															{place.address}
														</p>
													</div>
												</button>
											))}
										</div>
									)}
								</div>

								{/* Address */}
								<div>
									<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
										<FiMapPin size={15} className="text-primary-500" />
										Restaurant Address
									</label>
									<div className="relative">
										<div className="flex gap-2">
											<div className="relative flex-1">
												<input
													ref={addressInputRef}
													type="text"
													name="restaurantAddress"
													value={form.restaurantAddress}
													onChange={handleAddressChange}
													onFocus={() =>
														addressSuggestions.length > 0 && setShowSuggestions(true)
													}
													className="input w-full"
													placeholder="e.g. 123 Main St, City"
													autoComplete="off"
													required
												/>
												{/* Suggestions dropdown */}
												{showSuggestions && addressSuggestions.length > 0 && (
													<div
														ref={suggestionsRef}
														className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
													>
														{addressSuggestions.map((s) => (
															<button
																key={s.place_id}
																type="button"
																onClick={() => handleSelectSuggestion(s)}
																className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors dark:hover:bg-gray-700/50"
															>
																<FiMapPin
																	size={14}
																	className="mt-0.5 shrink-0 text-primary-400"
																/>
																<span className="text-gray-700 dark:text-gray-300 line-clamp-2">
																	{s.display_name}
																</span>
															</button>
														))}
													</div>
												)}
											</div>
											<button
												type="button"
												onClick={handleGetLocation}
												disabled={locating}
												className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-all duration-200"
												title="Detect my location"
											>
												{locating ? (
													<FiLoader size={16} className="animate-spin" />
												) : (
													<MdMyLocation size={16} />
												)}
											</button>
										</div>
									</div>
								</div>

								{/* Rating */}
								<div>
									<label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
										<FiStar size={15} className="text-primary-500" />
										Your Rating
									</label>
									<div className="flex items-center gap-4">
										<StarRating
											rating={form.rating}
											onChange={(rating) =>
												setForm((prev) => ({
													...prev,
													rating,
												}))
											}
											size="lg"
										/>
										{form.rating > 0 && (
											<span className="rounded-lg bg-yellow-50 px-2.5 py-1 text-sm font-bold text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
												{form.rating}.0
											</span>
										)}
									</div>
								</div>

								{/* Description */}
								<div>
									<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
										<FiFileText size={15} className="text-primary-500" />
										Your Review
									</label>
									<textarea
										name="description"
										value={form.description}
										onChange={handleChange}
										className="input min-h-[120px] resize-none"
										placeholder="Tell us about your experience — What did you order? How was the taste, presentation, and service?"
										required
									/>
									<p className="mt-1.5 text-right text-xs text-gray-400 dark:text-gray-500">
										{charCount} characters
									</p>
								</div>
							</div>

							{/* Actions */}
							<div className="mt-6 flex gap-3">
								<button
									type="button"
									onClick={handlePrevStep}
									className="btn-secondary flex-1"
									disabled={loading}
								>
									Back
								</button>
								<button type="submit" className="btn-primary flex-[2] btn-lg" disabled={loading}>
									{loading ? (
										<span className="flex items-center gap-2">
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
											Publishing…
										</span>
									) : (
										"Publish Review"
									)}
								</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
