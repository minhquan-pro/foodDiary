import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider, useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import store from "./src/app/store";
import { SocketProvider } from "./src/context/SocketContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { fetchCurrentUser } from "./src/features/auth/authSlice";

function AppContent() {
	const dispatch = useDispatch();
	const { colors } = useTheme();

	useEffect(() => {
		dispatch(fetchCurrentUser());
	}, []);

	return (
		<SocketProvider>
			<SafeAreaProvider>
				<StatusBar style={colors.statusBar} />
				<AppNavigator />
				<Toast />
			</SafeAreaProvider>
		</SocketProvider>
	);
}

export default function App() {
	return (
		<Provider store={store}>
			<ThemeProvider>
				<AppContent />
			</ThemeProvider>
		</Provider>
	);
}
