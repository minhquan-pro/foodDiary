import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { createPost } from "./postsSlice.js";
import StarRating from "../../components/StarRating.jsx";
import toast from "react-hot-toast";
import { FiUpload, FiCamera, FiMapPin, FiStar, FiFileText } from "react-icons/fi";

export default function CreatePostPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { loading } = useSelector((state) => state.posts);

	const [form, setForm] = useState({
		restaurantName: "",
		restaurantAddress: "",
		rating: 0,
		description: "",
	});
	const [image, setImage] = useState(null);
	const [preview, setPreview] = useState(null);

	const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImage(file);
			setPreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!image) return toast.error("Please upload a food photo");
		if (form.rating === 0) return toast.error("Please select a rating");

		const formData = new FormData();
		formData.append("image", image);
		formData.append("restaurantName", form.restaurantName);
		formData.append("restaurantAddress", form.restaurantAddress);
		formData.append("rating", form.rating);
		formData.append("description", form.description);

		const result = await dispatch(createPost(formData));
		if (createPost.fulfilled.match(result)) {
			toast.success("Post created!");
			navigate("/");
		} else {
			toast.error(result.payload || "Failed to create post");
		}
	};

	return (
		<div className="mx-auto max-w-6xl px-6 py-8 animate-fade-in">
			<div className="mb-8">
				<h1 className="text-2xl font-bold text-gray-900 tracking-tight dark:text-gray-100">
					Create New Review
				</h1>
				<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Share your food experience with the community
				</p>
			</div>

			<form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				{/* Left column - Image */}
				<div>
					<label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
						<FiCamera size={16} className="text-primary-500" />
						Food Photo
					</label>
					<label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 transition-all duration-200 hover:border-primary-400 hover:bg-primary-50/30 min-h-[400px] dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-primary-900/20">
						{preview ? (
							<img src={preview} alt="Preview" className="h-full w-full rounded-2xl object-cover" />
						) : (
							<div className="text-center p-8">
								<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
									<FiUpload className="text-primary-500" size={28} />
								</div>
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Click to upload a photo
								</p>
								<p className="mt-1 text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 10MB</p>
							</div>
						)}
						<input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
					</label>
				</div>

				{/* Right column - Form fields */}
				<div className="space-y-6">
					{/* Restaurant Name */}
					<div>
						<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
							<FiFileText size={15} className="text-primary-500" />
							Restaurant Name
						</label>
						<input
							type="text"
							name="restaurantName"
							value={form.restaurantName}
							onChange={handleChange}
							className="input"
							placeholder="e.g. The Italian Corner"
							required
						/>
					</div>

					{/* Address */}
					<div>
						<label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
							<FiMapPin size={15} className="text-primary-500" />
							Restaurant Address
						</label>
						<input
							type="text"
							name="restaurantAddress"
							value={form.restaurantAddress}
							onChange={handleChange}
							className="input"
							placeholder="e.g. 123 Main St, City"
							required
						/>
					</div>

					{/* Rating */}
					<div>
						<label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
							<FiStar size={15} className="text-primary-500" />
							Rating
						</label>
						<StarRating
							rating={form.rating}
							onChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
							size="lg"
						/>
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
							className="input min-h-[160px] resize-none"
							placeholder="Tell us about your experience…"
							required
						/>
					</div>

					<button type="submit" className="btn-primary w-full btn-lg" disabled={loading}>
						{loading ? "Publishing…" : "Publish Review"}
					</button>
				</div>
			</form>
		</div>
	);
}
