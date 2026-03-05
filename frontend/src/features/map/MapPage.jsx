import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchMapData, shareLocation, removeLocation } from "./mapSlice.js";

// Fix Leaflet default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
	iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom user location icon (pulsing blue dot)
const makeUserIcon = (avatarUrl, backendBase) => {
	const src = avatarUrl
		? avatarUrl.startsWith("http")
			? avatarUrl
			: `${backendBase}${avatarUrl}`
		: null;

	const html = src
		? `<div style="width:36px;height:36px;border-radius:50%;border:3px solid #3b82f6;overflow:hidden;box-shadow:0 0 0 4px rgba(59,130,246,0.25)">
				<img src="${src}" style="width:100%;height:100%;object-fit:cover"/>
			</div>`
		: `<div style="width:36px;height:36px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.25);display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:14px">📍</div>`;

	return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18] });
};

const STAR_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

function StarBadge({ rating }) {
	return (
		<span className="inline-flex items-center gap-0.5 text-xs font-bold" style={{ color: STAR_COLORS[rating] }}>
			{"★".repeat(rating)}
			{"☆".repeat(5 - rating)}
		</span>
	);
}

function FlyToLocation({ coords }) {
	const map = useMap();
	useEffect(() => {
		if (coords) map.flyTo(coords, 14, { duration: 1.2 });
	}, [coords, map]);
	return null;
}

const DURATION_OPTIONS = [
	{ days: 1, label: "1 ngày" },
	{ days: 3, label: "3 ngày" },
	{ days: 7, label: "7 ngày" },
];

function daysLeft(expiresAt) {
	const diff = new Date(expiresAt) - Date.now();
	if (diff <= 0) return "Đã hết hạn";
	const d = Math.ceil(diff / (1000 * 60 * 60 * 24));
	return `Còn ${d} ngày`;
}

export default function MapPage() {
	const dispatch = useDispatch();
	const { posts, userLocations, myLocation, status, locationStatus } = useSelector((state) => state.map);
	const currentUser = useSelector((state) => state.auth.user);

	const [showPanel, setShowPanel] = useState(false);
	const [selectedDays, setSelectedDays] = useState(7);
	const [label, setLabel] = useState("");
	const [geoError, setGeoError] = useState(null);
	const [flyTo, setFlyTo] = useState(null);
	const panelRef = useRef(null);

	useEffect(() => {
		if (status === "idle") dispatch(fetchMapData());
	}, [dispatch, status]);

	// Close panel on outside click
	useEffect(() => {
		const handler = (e) => {
			if (panelRef.current && !panelRef.current.contains(e.target)) setShowPanel(false);
		};
		if (showPanel) document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [showPanel]);

	const backendBase = import.meta.env.VITE_API_URL
		? import.meta.env.VITE_API_URL.replace("/api", "")
		: "";

	const getImageSrc = (url) => (url?.startsWith("http") ? url : `${backendBase}${url}`);

	const handleShareLocation = () => {
		setGeoError(null);
		if (!navigator.geolocation) {
			setGeoError("Trình duyệt không hỗ trợ định vị.");
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const { latitude, longitude } = pos.coords;
				dispatch(shareLocation({ latitude, longitude, label: label.trim() || null, days: selectedDays })).then(
					(action) => {
						if (action.meta.requestStatus === "fulfilled") {
							setShowPanel(false);
							setLabel("");
							setFlyTo([latitude, longitude]);
						}
					}
				);
			},
			() => setGeoError("Không thể lấy vị trí. Vui lòng cho phép truy cập định vị.")
		);
	};

	const handleClearLocation = () => {
		dispatch(removeLocation());
	};

	const totalMarkers = posts.length + userLocations.length;

	return (
		<div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
			{/* Header */}
			<div className="px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h1 className="text-lg font-bold text-gray-900 dark:text-white">Food Map</h1>
					<p className="text-xs text-gray-500 dark:text-gray-400">
						{status === "succeeded"
							? `${posts.length} bài viết · ${userLocations.length} người đang check-in`
							: "Đang tải..."}
					</p>
				</div>

				<div className="flex items-center gap-2 flex-shrink-0">
					{status === "loading" && (
						<div className="h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
					)}

					{/* My location status */}
					{myLocation && (
						<div className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-700">
							<span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
							<span>{daysLeft(myLocation.expiresAt)}</span>
							<button
								onClick={handleClearLocation}
								className="ml-0.5 hover:text-red-500 transition-colors font-bold"
								title="Xoá vị trí"
							>
								×
							</button>
						</div>
					)}

					{/* Share location button */}
					<div className="relative" ref={panelRef}>
						<button
							onClick={() => setShowPanel((v) => !v)}
							className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors"
						>
							<span>📍</span>
							<span>{myLocation ? "Cập nhật" : "Check-in"}</span>
						</button>

						{showPanel && (
							<div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
								<p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
									Chia sẻ vị trí của bạn
								</p>

								{/* Note */}
								<div className="mb-3">
									<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
										Ghi chú (tuỳ chọn)
									</label>
									<input
										type="text"
										value={label}
										onChange={(e) => setLabel(e.target.value)}
										placeholder="Đang ăn phở 🍜"
										maxLength={60}
										className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
									/>
								</div>

								{/* Duration */}
								<div className="mb-3">
									<label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
										Hiển thị trong
									</label>
									<div className="flex gap-2">
										{DURATION_OPTIONS.map(({ days, label: lbl }) => (
											<button
												key={days}
												onClick={() => setSelectedDays(days)}
												className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-colors ${
													selectedDays === days
														? "bg-primary-500 text-white border-primary-500"
														: "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400"
												}`}
											>
												{lbl}
											</button>
										))}
									</div>
								</div>

								{geoError && (
									<p className="text-xs text-red-500 mb-2">{geoError}</p>
								)}

								<button
									onClick={handleShareLocation}
									disabled={locationStatus === "loading"}
									className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
								>
									{locationStatus === "loading" ? "Đang xác định..." : "Xác nhận vị trí"}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Map */}
			<div className="flex-1 relative">
				{status === "failed" && (
					<div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
						<p className="text-gray-500 dark:text-gray-400">Không thể tải bản đồ. Vui lòng thử lại.</p>
					</div>
				)}

				<MapContainer
					center={[16.0, 106.0]}
					zoom={6}
					className="w-full h-full"
					style={{ zIndex: 0 }}
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>

					{flyTo && <FlyToLocation coords={flyTo} />}

					{/* Post markers */}
					<MarkerClusterGroup chunkedLoading>
						{posts.map((post) => (
							<Marker key={post.id} position={[post.latitude, post.longitude]}>
								<Popup maxWidth={260} className="food-map-popup">
									<div className="w-56">
										<div className="rounded-lg overflow-hidden mb-2 -mx-3 -mt-3">
											<img
												src={getImageSrc(post.imageUrl)}
												alt={post.restaurantName}
												className="w-full object-cover"
												style={{ height: 140 }}
											/>
										</div>
										<p className="font-bold text-gray-900 text-sm leading-tight">
											{post.restaurantName}
										</p>
										{post.dishName && (
											<p className="text-xs text-primary-600 font-medium mt-0.5">
												{post.dishName}
											</p>
										)}
										<div className="mt-1">
											<StarBadge rating={post.rating} />
										</div>
										<p className="text-xs text-gray-500 mt-1 line-clamp-2">
											{post.restaurantAddress}
										</p>
										<div className="flex items-center gap-1.5 mt-2">
											{post.user.avatarUrl ? (
												<img
													src={getImageSrc(post.user.avatarUrl)}
													alt={post.user.name}
													className="h-5 w-5 rounded-full object-cover"
												/>
											) : (
												<div className="h-5 w-5 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary-600">
													{post.user.name?.[0]?.toUpperCase()}
												</div>
											)}
											<span className="text-xs text-gray-500">{post.user.name}</span>
										</div>
										<Link
											to={`/posts/${post.id}`}
											className="mt-2 block text-center text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg py-1.5 transition-colors"
										>
											Xem bài viết
										</Link>
									</div>
								</Popup>
							</Marker>
						))}
					</MarkerClusterGroup>

					{/* User check-in markers (not clustered — always visible) */}
					{userLocations.map((ul) => (
						<Marker
							key={ul.id}
							position={[ul.latitude, ul.longitude]}
							icon={makeUserIcon(ul.user.avatarUrl, backendBase)}
							zIndexOffset={1000}
						>
							<Popup maxWidth={220}>
								<div className="w-44">
									<div className="flex items-center gap-2 mb-1.5">
										{ul.user.avatarUrl ? (
											<img
												src={getImageSrc(ul.user.avatarUrl)}
												alt={ul.user.name}
												className="h-8 w-8 rounded-full object-cover border-2 border-blue-400"
											/>
										) : (
											<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
												{ul.user.name?.[0]?.toUpperCase()}
											</div>
										)}
										<div>
											<p className="font-semibold text-gray-900 text-sm leading-tight">
												{ul.user.name}
											</p>
											<p className="text-[10px] text-blue-500">{daysLeft(ul.expiresAt)}</p>
										</div>
									</div>
									{ul.label && (
										<p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-2 py-1 mt-1">
											{ul.label}
										</p>
									)}
									<Link
										to={`/profile/${ul.user.id}`}
										className="mt-2 block text-center text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-lg py-1.5 transition-colors"
									>
										Xem trang cá nhân
									</Link>
								</div>
							</Popup>
						</Marker>
					))}
				</MapContainer>

				{/* Empty state overlay */}
				{status === "succeeded" && totalMarkers === 0 && (
					<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
						<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg px-6 py-5 text-center max-w-xs">
							<p className="text-2xl mb-1">🗺️</p>
							<p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Chưa có địa điểm nào</p>
							<p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
								Tạo bài viết với địa chỉ hoặc check-in vị trí của bạn.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
