import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markAllRead,
  markRead,
  fetchUnreadCount,
} from "../features/notifications/notificationsSlice";

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getNotifIcon(type) {
  switch (type) {
    case "LIKE":
      return "❤️";
    case "COMMENT":
      return "💬";
    case "FOLLOW":
      return "👤";
    case "REPLY":
      return "↩️";
    case "COMMENT_LIKE":
      return "👍";
    default:
      return "🔔";
  }
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { notifications, pagination, unreadCount, loading } = useSelector(
    (state) => state.notifications
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1 }));
    dispatch(fetchUnreadCount());
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchNotifications({ page: 1 })).finally(() =>
      setRefreshing(false)
    );
  }, []);

  const loadMore = () => {
    if (loading || !pagination?.hasMore) return;
    dispatch(fetchNotifications({ page: (pagination?.page || 1) + 1 }));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  const handleNotifPress = (notif) => {
    if (!notif.isRead) {
      dispatch(markRead(notif.id));
    }
    // Navigate based on type
    if (notif.postId) {
      navigation.navigate("Feed", {
        screen: "PostDetail",
        params: { postId: notif.postId },
      });
    } else if (notif.actorId) {
      navigation.navigate("Feed", {
        screen: "UserProfile",
        params: { userId: notif.actorId },
      });
    }
  };

  const renderNotification = ({ item: notif }) => (
    <TouchableOpacity
      style={[
        styles.notifItem,
        !notif.isRead && styles.notifItemUnread,
      ]}
      onPress={() => handleNotifPress(notif)}
    >
      <View style={styles.notifIcon}>
        <Text style={styles.notifIconText}>{getNotifIcon(notif.type)}</Text>
      </View>
      <View style={styles.notifContent}>
        <Text style={styles.notifMessage} numberOfLines={2}>
          <Text style={styles.notifActor}>{notif.actor?.name || "Someone"}</Text>
          {" "}
          {notif.message || getNotifMessage(notif.type)}
        </Text>
        <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
      </View>
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllBtn}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              style={styles.footer}
              size="small"
              color="#F97316"
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F97316"]}
            tintColor="#F97316"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function getNotifMessage(type) {
  switch (type) {
    case "LIKE":
      return "liked your post";
    case "COMMENT":
      return "commented on your post";
    case "FOLLOW":
      return "started following you";
    case "REPLY":
      return "replied to your comment";
    case "COMMENT_LIKE":
      return "liked your comment";
    default:
      return "sent you a notification";
  }
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
  },
  markAllBtn: {
    fontSize: 14,
    color: "#F97316",
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  notifItemUnread: {
    backgroundColor: "#FFF7ED",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifIconText: {
    fontSize: 18,
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  notifActor: {
    fontWeight: "700",
    color: "#1F2937",
  },
  notifTime: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F97316",
    marginLeft: 8,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  footer: {
    paddingVertical: 20,
  },
});
