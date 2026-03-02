import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

const lightColors = {
	background: "#FFFFFF",
	surface: "#F9FAFB",
	card: "#FFFFFF",
	text: "#1F2937",
	textSecondary: "#6B7280",
	textMuted: "#9CA3AF",
	border: "#E5E7EB",
	primary: "#F97316",
	primaryLight: "#FFF7ED",
	inputBg: "#F3F4F6",
	headerBg: "#FFFFFF",
	tabBar: "#FFFFFF",
	statusBar: "dark",
};

const darkColors = {
	background: "#111827",
	surface: "#1F2937",
	card: "#1F2937",
	text: "#F9FAFB",
	textSecondary: "#D1D5DB",
	textMuted: "#9CA3AF",
	border: "#374151",
	primary: "#F97316",
	primaryLight: "#431407",
	inputBg: "#374151",
	headerBg: "#1F2937",
	tabBar: "#1F2937",
	statusBar: "light",
};

export function ThemeProvider({ children }) {
	const systemScheme = useColorScheme();
	const [theme, setTheme] = useState("light");
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		AsyncStorage.getItem("theme").then((saved) => {
			if (saved) {
				setTheme(saved);
			} else {
				setTheme(systemScheme === "dark" ? "dark" : "light");
			}
			setLoaded(true);
		});
	}, []);

	const toggleTheme = () => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		AsyncStorage.setItem("theme", next);
	};

	const colors = theme === "dark" ? darkColors : lightColors;
	const isDark = theme === "dark";

	if (!loaded) return null;

	return <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
