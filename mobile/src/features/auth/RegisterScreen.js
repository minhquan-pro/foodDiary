import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { register, clearError } from "./authSlice";
import Toast from "react-native-toast-message";

export default function RegisterScreen({ navigation }) {
	const dispatch = useDispatch();
	const { loading, error } = useSelector((state) => state.auth);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	useEffect(() => {
		if (error) {
			Toast.show({ type: "error", text1: "Registration Failed", text2: error });
			dispatch(clearError());
		}
	}, [error]);

	const handleRegister = () => {
		if (!name.trim() || !email.trim() || !password || !confirmPassword) {
			Toast.show({ type: "error", text1: "Please fill in all fields" });
			return;
		}
		if (password !== confirmPassword) {
			Toast.show({ type: "error", text1: "Passwords do not match" });
			return;
		}
		if (password.length < 6) {
			Toast.show({
				type: "error",
				text1: "Password must be at least 6 characters",
			});
			return;
		}
		dispatch(register({ name: name.trim(), email: email.trim(), password }));
	};

	return (
		<KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
				<View style={styles.header}>
					<Text style={styles.logo}>🍽️ FoodDiary</Text>
					<Text style={styles.subtitle}>Join the community</Text>
				</View>

				<View style={styles.form}>
					<Text style={styles.title}>Create Account</Text>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Name</Text>
						<TextInput
							style={styles.input}
							placeholder="Your full name"
							placeholderTextColor="#9CA3AF"
							value={name}
							onChangeText={setName}
							autoCapitalize="words"
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Email</Text>
						<TextInput
							style={styles.input}
							placeholder="Enter your email"
							placeholderTextColor="#9CA3AF"
							value={email}
							onChangeText={setEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Password</Text>
						<TextInput
							style={styles.input}
							placeholder="At least 6 characters"
							placeholderTextColor="#9CA3AF"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>
					</View>

					<View style={styles.inputContainer}>
						<Text style={styles.label}>Confirm Password</Text>
						<TextInput
							style={styles.input}
							placeholder="Confirm your password"
							placeholderTextColor="#9CA3AF"
							value={confirmPassword}
							onChangeText={setConfirmPassword}
							secureTextEntry
						/>
					</View>

					<TouchableOpacity
						style={[styles.button, loading && styles.buttonDisabled]}
						onPress={handleRegister}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Create Account</Text>
						)}
					</TouchableOpacity>

					<View style={styles.footer}>
						<Text style={styles.footerText}>Already have an account? </Text>
						<TouchableOpacity onPress={() => navigation.goBack()}>
							<Text style={styles.footerLink}>Sign In</Text>
						</TouchableOpacity>
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
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 24,
	},
	header: {
		alignItems: "center",
		marginBottom: 32,
	},
	logo: {
		fontSize: 36,
		fontWeight: "800",
		color: "#1F2937",
	},
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		marginTop: 8,
	},
	form: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: "#1F2937",
		marginBottom: 24,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#374151",
		marginBottom: 6,
	},
	input: {
		backgroundColor: "#F3F4F6",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
		color: "#1F2937",
		borderWidth: 1,
		borderColor: "#E5E7EB",
	},
	button: {
		backgroundColor: "#F97316",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginTop: 8,
	},
	buttonDisabled: {
		opacity: 0.7,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: 20,
	},
	footerText: {
		color: "#6B7280",
		fontSize: 14,
	},
	footerLink: {
		color: "#F97316",
		fontSize: 14,
		fontWeight: "600",
	},
});
