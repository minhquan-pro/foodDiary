import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { useTheme } from "../context/ThemeContext";

// Auth Screens
import LoginScreen from "../features/auth/LoginScreen";
import RegisterScreen from "../features/auth/RegisterScreen";

// Main Screens
import FeedScreen from "../screens/FeedScreen";
import CreatePostScreen from "../screens/CreatePostScreen";
import PostDetailScreen from "../screens/PostDetailScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ChatDetailScreen from "../screens/ChatDetailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import UserSearchScreen from "../screens/UserSearchScreen";
import FollowListScreen from "../screens/FollowListScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// ─── Tab Icons (simple text-based) ──────────────────────────

function TabIcon({ label, focused, badge }) {
	const icons = {
		Feed: "🏠",
		Chat: "💬",
		Notifications: "🔔",
		Profile: "👤",
	};
	return (
		<View style={styles.tabIconContainer}>
			<Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icons[label] || "📱"}</Text>
			{badge > 0 && (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
				</View>
			)}
		</View>
	);
}

// ─── Stack Navigators ────────────────────────────────────────

function FeedStackNavigator() {
	return (
		<FeedStack.Navigator screenOptions={{ headerShown: false }}>
			<FeedStack.Screen name="FeedHome" component={FeedScreen} />
			<FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
			<FeedStack.Screen name="CreatePost" component={CreatePostScreen} />
			<FeedStack.Screen name="UserProfile" component={ProfileScreen} />
			<FeedStack.Screen name="EditProfile" component={EditProfileScreen} />
			<FeedStack.Screen name="FollowList" component={FollowListScreen} />
		</FeedStack.Navigator>
	);
}

function ChatStackNavigator() {
	return (
		<ChatStack.Navigator screenOptions={{ headerShown: false }}>
			<ChatStack.Screen name="ChatList" component={ChatListScreen} />
			<ChatStack.Screen name="ChatDetail" component={ChatDetailScreen} />
		</ChatStack.Navigator>
	);
}

function ProfileStackNavigator() {
	return (
		<ProfileStack.Navigator screenOptions={{ headerShown: false }}>
			<ProfileStack.Screen name="MyProfile" component={ProfileScreen} />
			<ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
			<ProfileStack.Screen name="ProfilePostDetail" component={PostDetailScreen} />
			<ProfileStack.Screen name="FollowList" component={FollowListScreen} />
		</ProfileStack.Navigator>
	);
}

// ─── Main Tab Navigator ─────────────────────────────────────

function MainTabs() {
	const chatUnread = useSelector((state) => state.chat.unreadCount);
	const notifUnread = useSelector((state) => state.notifications.unreadCount);
	const { colors } = useTheme();

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: [styles.tabBar, { backgroundColor: colors.tabBar, borderTopColor: colors.border }],
				tabBarActiveTintColor: "#F97316",
				tabBarInactiveTintColor: colors.textMuted,
				tabBarLabelStyle: styles.tabLabel,
			}}
		>
			<Tab.Screen
				name="Feed"
				component={FeedStackNavigator}
				options={{
					tabBarIcon: ({ focused }) => <TabIcon label="Feed" focused={focused} />,
				}}
			/>
			<Tab.Screen
				name="Chat"
				component={ChatStackNavigator}
				options={{
					tabBarIcon: ({ focused }) => <TabIcon label="Chat" focused={focused} badge={chatUnread} />,
				}}
			/>
			<Tab.Screen
				name="Notifications"
				component={NotificationsScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon label="Notifications" focused={focused} badge={notifUnread} />
					),
				}}
			/>
			<Tab.Screen
				name="Profile"
				component={ProfileStackNavigator}
				options={{
					tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
				}}
			/>
		</Tab.Navigator>
	);
}

// ─── Auth Stack ─────────────────────────────────────────────

function AuthStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen name="Register" component={RegisterScreen} />
		</Stack.Navigator>
	);
}

// ─── Root Navigator ─────────────────────────────────────────

export default function AppNavigator() {
	const { user, initialized } = useSelector((state) => state.auth);
	const { colors } = useTheme();

	if (!initialized) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
				<Text style={[styles.loadingText, { color: colors.text }]}>🍽️ FoodDiary</Text>
			</View>
		);
	}

	return (
		<NavigationContainer>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				{user ? (
					<>
						<Stack.Screen name="Main" component={MainTabs} />
						<Stack.Screen name="UserSearch" component={UserSearchScreen} />
					</>
				) : (
					<Stack.Screen name="Auth" component={AuthStack} />
				)}
			</Stack.Navigator>
		</NavigationContainer>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#F9FAFB",
	},
	loadingText: {
		fontSize: 32,
		fontWeight: "800",
		color: "#1F2937",
	},
	tabBar: {
		backgroundColor: "#FFFFFF",
		borderTopWidth: 1,
		borderTopColor: "#E5E7EB",
		height: 60,
		paddingBottom: 8,
		paddingTop: 4,
	},
	tabLabel: {
		fontSize: 11,
		fontWeight: "600",
	},
	tabIconContainer: {
		position: "relative",
		alignItems: "center",
	},
	tabIcon: {
		fontSize: 22,
	},
	tabIconActive: {
		transform: [{ scale: 1.1 }],
	},
	badge: {
		position: "absolute",
		top: -4,
		right: -12,
		backgroundColor: "#EF4444",
		borderRadius: 10,
		minWidth: 18,
		height: 18,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 4,
	},
	badgeText: {
		color: "#FFFFFF",
		fontSize: 10,
		fontWeight: "700",
	},
});
