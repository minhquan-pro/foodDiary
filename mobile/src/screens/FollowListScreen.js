import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Image,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api, { getImageUrl } from "../lib/api";
import VerifiedBadge from "../components/VerifiedBadge";
import { useTheme } from "../context/ThemeContext";

export default function FollowListScreen({ route, navigation }) {
	const { userId, type, title } = route.params;
	const insets = useSafeAreaInsets();
	const { colors } = useTheme();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api
			.get(`/users/${userId}/${type}`)
			.then(({ data }) => setUsers(data.data.users || []))
			.catch(() => setUsers([]))
			.finally(() => setLoading(false));
	}, [userId, type]);

	const renderUser = ({ item: user }) => (
		<TouchableOpacity
			style={[styles.userItem, { borderBottomColor: colors.border }]}
			onPress={() => navigation.navigate("UserProfile", { userId: user.id })}
		>
			{user.avatarUrl ? (
				<Image source={{ uri: getImageUrl(user.avatarUrl) }} style={styles.avatar} />
			) : (
				<View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
					<Text style={[styles.avatarText, { color: colors.primary }]}>
						{user.name?.charAt(0).toUpperCase()}
					</Text>
				</View>
			)}
			<View style={styles.userInfo}>
				<View style={styles.nameRow}>
					<Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
					<VerifiedBadge role={user.role} />
				</View>
				{user.bio ? (
					<Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
						{user.bio}
					</Text>
				) : null}
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
				</TouchableOpacity>
				<Text style={[styles.title, { color: colors.text }]}>{title}</Text>
				<View style={styles.placeholder} />
			</View>

			{loading ? (
				<ActivityIndicator style={styles.loading} size="large" color="#F97316" />
			) : (
				<FlatList
					data={users}
					keyExtractor={(item) => String(item.id)}
					renderItem={renderUser}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {title.toLowerCase()} yet</Text>
						</View>
					}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
	},
	backBtn: {
		fontSize: 16,
		fontWeight: "600",
		color: "#F97316",
	},
	title: {
		fontSize: 17,
		fontWeight: "700",
	},
	placeholder: {
		width: 50,
	},
	loading: {
		marginTop: 40,
	},
	userItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	avatarPlaceholder: {
		width: 48,
		height: 48,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "700",
	},
	userInfo: {
		flex: 1,
		marginLeft: 12,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	userName: {
		fontSize: 15,
		fontWeight: "600",
	},
	userBio: {
		fontSize: 13,
		marginTop: 2,
	},
	empty: {
		paddingTop: 60,
		alignItems: "center",
	},
	emptyText: {
		fontSize: 15,
	},
});
