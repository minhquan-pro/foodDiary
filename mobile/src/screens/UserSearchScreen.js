import React, { useState, useCallback } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api, { getImageUrl } from "../lib/api";
import VerifiedBadge from "../components/VerifiedBadge";

export default function UserSearchScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const searchTimeout = React.useRef(null);

	const handleSearch = useCallback((text) => {
		setQuery(text);
		clearTimeout(searchTimeout.current);

		if (!text.trim()) {
			setResults([]);
			return;
		}

		searchTimeout.current = setTimeout(async () => {
			setLoading(true);
			try {
				const { data } = await api.get(`/users?q=${encodeURIComponent(text.trim())}`);
				setResults(data.data.users || []);
			} catch (err) {
				console.error("Search error:", err);
			}
			setLoading(false);
		}, 400);
	}, []);

	const renderUser = ({ item: user }) => (
		<TouchableOpacity
			style={styles.userItem}
			onPress={() =>
				navigation.navigate("Main", {
					screen: "Feed",
					params: {
						screen: "UserProfile",
						params: { userId: user.id },
					},
				})
			}
		>
			{user.avatarUrl ? (
				<Image source={{ uri: getImageUrl(user.avatarUrl) }} style={styles.avatar} />
			) : (
				<View style={styles.avatarPlaceholder}>
					<Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
				</View>
			)}
			<View style={styles.userInfo}>
				<View style={styles.nameRow}>
					<Text style={styles.userName}>{user.name}</Text>
					<VerifiedBadge role={user.role} />
				</View>
				{user.bio && (
					<Text style={styles.userBio} numberOfLines={1}>
						{user.bio}
					</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.backBtn}>← Back</Text>
				</TouchableOpacity>
				<TextInput
					style={styles.searchInput}
					placeholder="Search users..."
					placeholderTextColor="#9CA3AF"
					value={query}
					onChangeText={handleSearch}
					autoFocus
					autoCapitalize="none"
				/>
			</View>

			{loading ? (
				<ActivityIndicator style={styles.loading} size="large" color="#F97316" />
			) : (
				<FlatList
					data={results}
					keyExtractor={(item) => String(item.id)}
					renderItem={renderUser}
					ListEmptyComponent={
						query.trim() ? (
							<View style={styles.empty}>
								<Text style={styles.emptyText}>No users found</Text>
							</View>
						) : null
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
		gap: 12,
	},
	backBtn: {
		fontSize: 16,
		color: "#F97316",
		fontWeight: "600",
	},
	searchInput: {
		flex: 1,
		backgroundColor: "#F3F4F6",
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 15,
		color: "#1F2937",
	},
	loading: {
		marginTop: 40,
	},
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#F3F4F6",
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		marginRight: 12,
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	avatarPlaceholder: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#FED7AA",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 12,
	},
	avatarText: {
		fontSize: 18,
		fontWeight: "700",
		color: "#EA580C",
	},
	userInfo: {
		flex: 1,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	userName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#1F2937",
	},
	userBio: {
		fontSize: 13,
		color: "#6B7280",
		marginTop: 2,
	},
	empty: {
		alignItems: "center",
		paddingTop: 40,
	},
	emptyText: {
		fontSize: 16,
		color: "#9CA3AF",
	},
});
