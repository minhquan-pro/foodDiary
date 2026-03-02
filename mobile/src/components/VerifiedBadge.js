import React from "react";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function VerifiedBadge({ role, size = 16 }) {
	if (role !== "admin") return null;
	// Blue color for verified badge (not orange)
	return <MaterialCommunityIcons name="check-decagram" size={size} color="#3B82F6" style={styles.badge} />;
}

const styles = StyleSheet.create({
	badge: {
		marginLeft: 3,
	},
});
