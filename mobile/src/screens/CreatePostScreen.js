import React, { useState } from "react";
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
import { Alert } from "react-native";
import { createPost } from "../features/posts/postsSlice";
import { addOptimisticPost, removeOptimisticPost } from "../features/feed/feedSlice";
import Toast from "react-native-toast-message";

export default function CreatePostScreen({ navigation }) {
	const insets = useSafeAreaInsets();
	const dispatch = useDispatch();
	const { user: currentUser } = useSelector((state) => state.auth);

	const [restaurantName, setRestaurantName] = useState("");
	const [restaurantAddress, setRestaurantAddress] = useState("");
	const [description, setDescription] = useState("");
	const [rating, setRating] = useState(5);
	const [image, setImage] = useState(null);
	const [submitting, setSubmitting] = useState(false);

	const pickImage = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Toast.show({
				type: "error",
				text1: "Permission needed",
				text2: "Please allow access to your photos",
			});
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (!result.canceled && result.assets[0]) {
			setImage(result.assets[0]);
		}
	};

	const takePhoto = async () => {
		const { status } = await ImagePicker.requestCameraPermissionsAsync();
		if (status !== "granted") {
			Toast.show({
				type: "error",
				text1: "Permission needed",
				text2: "Please allow access to your camera",
			});
			return;
		}

		const result = await ImagePicker.launchCameraAsync({
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.8,
		});

		if (!result.canceled && result.assets && result.assets[0]) {
			setImage(result.assets[0]);
		}
	};

	const chooseImageSource = () => {
		Alert.alert("Add Photo", "Choose image source", [
			{ text: "Take Photo", onPress: takePhoto },
			{ text: "Choose from Library", onPress: pickImage },
			{ text: "Cancel", style: "cancel" },
		]);
	};

	const handleSubmit = async () => {
		if (!restaurantName.trim() || !description.trim() || !rating) {
			Toast.show({
				type: "error",
				text1: "Please fill in all required fields",
			});
			return;
		}

		setSubmitting(true);

		// Create optimistic post
		const tempId = `temp-${Date.now()}`;
		const optimisticPost = {
			id: tempId,
			restaurantName: restaurantName.trim(),
			restaurantAddress: restaurantAddress.trim(),
			description: description.trim(),
			rating,
			imageUrl: image?.uri || null,
			createdAt: new Date().toISOString(),
			user: {
				id: currentUser.id,
				name: currentUser.name,
				avatarUrl: currentUser.avatarUrl,
				role: currentUser.role,
			},
			_count: { likes: 0, comments: 0 },
		};

		dispatch(addOptimisticPost(optimisticPost));
		navigation.goBack();
		Toast.show({ type: "success", text1: "Post shared! 🎉" });

		// Build form data
		const formData = new FormData();
		formData.append("restaurantName", restaurantName.trim());
		formData.append("restaurantAddress", restaurantAddress.trim());
		formData.append("description", description.trim());
		formData.append("rating", String(rating));

		if (image) {
			const uri = image.uri;
			const filename = uri.split("/").pop();
			const match = /\.(\w+)$/.exec(filename);
			const type = match ? `image/${match[1]}` : "image/jpeg";
			formData.append("image", { uri, name: filename, type });
		}

		try {
			await dispatch(createPost(formData)).unwrap();
		} catch (err) {
			dispatch(removeOptimisticPost(tempId));
			Toast.show({ type: "error", text1: "Failed to create post", text2: err });
		}
		setSubmitting(false);
	};

	const renderStars = () => {
		return (
			<View style={styles.starsRow}>
				{[1, 2, 3, 4, 5].map((star) => (
					<TouchableOpacity key={star} onPress={() => setRating(star)}>
						<Text style={[styles.star, { color: star <= rating ? "#F59E0B" : "#D1D5DB" }]}>★</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={styles.cancelBtn}>Cancel</Text>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>New Post</Text>
				<TouchableOpacity
					onPress={handleSubmit}
					disabled={submitting}
					style={[styles.postBtn, submitting && styles.postBtnDisabled]}
				>
					{submitting ? (
						<ActivityIndicator size="small" color="#fff" />
					) : (
						<Text style={styles.postBtnText}>Post</Text>
					)}
				</TouchableOpacity>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				{/* Image Picker */}
				<TouchableOpacity style={styles.imagePicker} onPress={chooseImageSource}>
					{image ? (
						<Image source={{ uri: image.uri }} style={styles.previewImage} />
					) : (
						<View style={styles.imagePickerPlaceholder}>
							<Text style={styles.imagePickerIcon}>📷</Text>
							<Text style={styles.imagePickerText}>Add Photo</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* Form */}
				<View style={styles.form}>
					<View style={styles.inputGroup}>
						<Text style={styles.label}>Restaurant Name *</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter restaurant name"
							placeholderTextColor="#9CA3AF"
							value={restaurantName}
							onChangeText={setRestaurantName}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Address</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter address"
							placeholderTextColor="#9CA3AF"
							value={restaurantAddress}
							onChangeText={setRestaurantAddress}
						/>
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Rating *</Text>
						{renderStars()}
					</View>

					<View style={styles.inputGroup}>
						<Text style={styles.label}>Description *</Text>
						<TextInput
							style={[styles.input, styles.textArea]}
							placeholder="Share your experience..."
							placeholderTextColor="#9CA3AF"
							value={description}
							onChangeText={setDescription}
							multiline
							numberOfLines={4}
							textAlignVertical="top"
						/>
					</View>
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
	postBtn: {
		backgroundColor: "#F97316",
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
	},
	postBtnDisabled: {
		opacity: 0.6,
	},
	postBtnText: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 14,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 40,
	},
	imagePicker: {
		margin: 16,
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#FFFFFF",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	previewImage: {
		width: "100%",
		height: 220,
	},
	imagePickerPlaceholder: {
		height: 180,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F3F4F6",
		borderWidth: 2,
		borderColor: "#E5E7EB",
		borderStyle: "dashed",
		borderRadius: 16,
	},
	imagePickerIcon: {
		fontSize: 40,
		marginBottom: 8,
	},
	imagePickerText: {
		fontSize: 16,
		color: "#6B7280",
		fontWeight: "500",
	},
	form: {
		paddingHorizontal: 16,
	},
	inputGroup: {
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
		height: 120,
		paddingTop: 14,
	},
	starsRow: {
		flexDirection: "row",
		gap: 8,
	},
	star: {
		fontSize: 32,
	},
});
