import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Image,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "../features/profile/profileSlice";
import { updateUser } from "../features/auth/authSlice";
import Toast from "react-native-toast-message";
import { getImageUrl } from "../lib/api";

export default function EditProfileScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);
	const { profile } = useSelector((state) => state.profile);

	const [name, setName] = useState(profile?.name || "");
	const [bio, setBio] = useState(profile?.bio || "");
	const [avatar, setAvatar] = useState(null);
	const [saving, setSaving] = useState(false);

	const pickAvatar = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Toast.show({ type: "error", text1: "Permission needed" });
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (!result.canceled && result.assets[0]) {
			setAvatar(result.assets[0]);
		}
	};

	const handleSave = async () => {
		if (!name.trim()) {
			Toast.show({ type: "error", text1: "Name is required" });
			return;
		}

		setSaving(true);
		const formData = new FormData();
		formData.append("name", name.trim());
		formData.append("bio", bio.trim());

		if (avatar) {
			const uri = avatar.uri;
			const filename = uri.split("/").pop();
			const match = /\.(\w+)$/.exec(filename);
			const type = match ? `image/${match[1]}` : "image/jpeg";
			formData.append("avatar", { uri, name: filename, type });
		}

		try {
			const result = await dispatch(updateProfile(formData)).unwrap();
			dispatch(updateUser(result));
			Toast.show({ type: "success", text1: "Profile updated!" });
			navigation.goBack();
		} catch (err) {
			Toast.show({ type: "error", text1: "Failed to update", text2: err });
		}
		setSaving(false);
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.cancelBtn}>Cancel</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Edit Profile</Text>
				<TouchableOpacity onPress={handleSave} disabled={saving}>
					{saving ? (
						<ActivityIndicator size="small" color="#F97316" />
					) : (
						<Text style={styles.saveBtn}>Save</Text>
					)}
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				{/* Avatar */}
				<TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
					{avatar ? (
						<Image source={{ uri: avatar.uri }} style={styles.avatar} />
					) : profile?.avatarUrl ? (
						<Image source={{ uri: getImageUrl(profile.avatarUrl) }} style={styles.avatar} />
					) : (
						<View style={styles.avatarPlaceholder}>
							<Text style={styles.avatarPlaceholderText}>{profile?.name?.charAt(0).toUpperCase()}</Text>
						</View>
					)}
					<Text style={styles.changePhotoText}>Change Photo</Text>
				</TouchableOpacity>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Name</Text>
					<TextInput
						style={styles.input}
						value={name}
						onChangeText={setName}
						placeholder="Your name"
						placeholderTextColor="#9CA3AF"
					/>
				</View>

				<View style={styles.inputGroup}>
					<Text style={styles.label}>Bio</Text>
					<TextInput
						style={[styles.input, styles.textArea]}
						value={bio}
						onChangeText={setBio}
						placeholder="Tell us about yourself"
						placeholderTextColor="#9CA3AF"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F9FAFB",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingBottom: 12,
		backgroundColor: "#FFFFFF",
		borderBottomWidth: 1,
		borderBottomColor: "#E5E7EB",
	},
	cancelBtn: {
		fontSize: 16,
		color: "#6B7280",
		fontWeight: "500",
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: "700",
		color: "#1F2937",
	},
	saveBtn: {
		fontSize: 16,
		color: "#F97316",
		fontWeight: "700",
	},
	content: {
		padding: 24,
		alignItems: "center",
	},
	avatarPicker: {
		alignItems: "center",
		marginBottom: 32,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		borderWidth: 3,
		borderColor: "#F97316",
	},
	avatarPlaceholder: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: "#FED7AA",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 3,
		borderColor: "#F97316",
	},
	avatarPlaceholderText: {
		fontSize: 36,
		fontWeight: "700",
		color: "#EA580C",
	},
	changePhotoText: {
		marginTop: 8,
		fontSize: 14,
		fontWeight: "600",
		color: "#F97316",
	},
	inputGroup: {
		width: "100%",
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		color: "#1F2937",
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	textArea: {
		height: 100,
		paddingTop: 14,
	},
});
