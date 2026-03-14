import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { getPublicEvidence } from "../src/services/api";

const PINATA_GATEWAY = "moccasin-glamorous-penguin-689.mypinata.cloud";

interface FeedItem {
  user: string;
  videoHash: string;
  gpsCoordinates: string;
  timestamp: number;
  isPublic: boolean;
}

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

function FeedCard({
  item,
  onPress,
}: {
  item: FeedItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PUBLIC</Text>
        </View>
      </View>
      <Text style={styles.detail}>
        From: {item.user.slice(0, 10)}...{item.user.slice(-6)}
      </Text>
      <Text style={styles.detail}>GPS: {item.gpsCoordinates}</Text>
      <Text style={styles.detail}>
        CID: {item.videoHash.slice(0, 16)}...
      </Text>
    </TouchableOpacity>
  );
}

export default function PublicFeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const data = await getPublicEvidence();
      setFeed(data);
    } catch (e) {
      console.error("Failed to fetch public feed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handlePress = (item: FeedItem) => {
    Linking.openURL(`https://${PINATA_GATEWAY}/ipfs/${item.videoHash}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={feed}
        keyExtractor={(item, i) => `${item.videoHash}-${i}`}
        renderItem={({ item }) => (
          <FeedCard item={item} onPress={() => handlePress(item)} />
        )}
        contentContainerStyle={
          feed.length === 0 ? styles.center : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No public evidence yet</Text>
        }
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchFeed();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  empty: { color: "#888888", fontSize: 16 },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  timestamp: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  badge: {
    backgroundColor: "#e94560",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  detail: {
    color: "#aaaaaa",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 4,
  },
});
