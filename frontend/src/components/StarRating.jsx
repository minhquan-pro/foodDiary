import { FiStar } from "react-icons/fi";

export default function StarRating({ rating, onChange, readOnly = false, size = "default" }) {
	const starSize = size === "lg" ? 28 : readOnly ? 16 : 24;

	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					disabled={readOnly}
					onClick={() => onChange?.(star)}
					className={`transition-all duration-150 ${
						readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 hover:text-yellow-400"
					}`}
				>
					<FiStar
						size={starSize}
						className={star <= rating ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-gray-300 dark:text-gray-600"}
					/>
				</button>
			))}
			{readOnly && rating > 0 && (
				<span className="ml-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400">{rating}.0</span>
			)}
		</div>
	);
}
