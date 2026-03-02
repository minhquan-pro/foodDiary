import { MdVerified } from "react-icons/md";

export default function VerifiedBadge({ role, size = 16, className = "" }) {
	if (role !== "admin") return null;

	return (
		<MdVerified size={size} className={`inline-block shrink-0 text-blue-500 ${className}`} title="Verified Admin" />
	);
}
