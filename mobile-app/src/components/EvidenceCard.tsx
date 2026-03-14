import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { EvidenceItem } from "../types";

export function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

interface EvidenceCardProps {
  item: EvidenceItem;
  onPress: () => void;
  isDecrypting: boolean;
}

export function EvidenceCard({ item, onPress, isDecrypting }: EvidenceCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={isDecrypting}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        <View
          style={[
            styles.badge,
            item.isPublic ? styles.badgePublic : styles.badgePrivate,
          ]}
        >
          <Text style={styles.badgeText}>
            {item.isPublic ? "PUBLIC" : "PRIVATE"}
          </Text>
        </View>
      </View>
      <Text style={styles.detail}>Owner: {item.owner.slice(0, 10)}...</Text>
      <Text style={styles.detail}>CID: {item.cid.slice(0, 16)}...</Text>
      {(item.latitude !== "0" || item.longitude !== "0") && (
        <Text style={styles.detail}>GPS: {item.latitude}, {item.longitude}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  badgePublic: { backgroundColor: "#e94560" },
  badgePrivate: {
    backgroundColor: "#0f3460",
    borderWidth: 1,
    borderColor: "#e94560",
  },
  badgeText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  detail: {
    color: "#aaaaaa",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 4,
  },
});
