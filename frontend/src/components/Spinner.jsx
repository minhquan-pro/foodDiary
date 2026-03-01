export default function Spinner() {
	return (
		<div className="flex flex-col items-center justify-center py-20 gap-3">
			<div className="relative">
				<div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-primary-500 dark:border-gray-700" />
				<div className="absolute inset-0 h-10 w-10 animate-ping rounded-full border-[3px] border-primary-200 opacity-20" />
			</div>
			<p className="text-sm text-gray-400 font-medium dark:text-gray-500">Loading...</p>
		</div>
	);
}
