import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function StarRating({ rating, size = 16, showNumber = true }) {
	const { colors } = useTheme();
	const stars = [];
	for (let i = 1; i <= 5; i++) {
		if (i <= Math.floor(rating)) {
			stars.push("★");
		} else if (i - 0.5 <= rating) {
			stars.push("★");
		} else {
			stars.push("☆");
		}
	}

	return (
		<View style={styles.container}>
			<Text style={[styles.stars, { fontSize: size, color: colors.primary }]}>{stars.join("")}</Text>
			{showNumber && (
				<Text style={[styles.number, { fontSize: size - 2, color: colors.textSecondary }]}>{rating}</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	stars: {
		color: "#F59E0B",
	},
	number: {
		color: "#6B7280",
		fontWeight: "600",
	},
});
