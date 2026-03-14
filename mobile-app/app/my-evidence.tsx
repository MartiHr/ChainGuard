import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import * as FileSystem from "expo-file-system/legacy";
import { Video, ResizeMode } from "expo-av";
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { getEvidenceByUser } from "../src/services/api";
import { decryptVideo } from "../src/services/decryption";
import { deriveKeys } from "../src/services/keys";

const PINATA_GATEWAY = "moccasin-glamorous-penguin-689.mypinata.cloud";

interface EvidenceItem {
  cid: string;
  timestamp: number;
  owner: string;
  isPublic: boolean;
}

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleString();
}

function EvidenceCard({
  item,
  onPress,
  isDecrypting,
}: {
  item: EvidenceItem;
  onPress: () => void;
  isDecrypting: boolean;
}) {
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
      <Text style={styles.detail}>GPS: {item.gpsCoordinates}</Text>
      <Text style={styles.detail}>CID: {item.videoHash.slice(0, 16)}...</Text>
    </TouchableOpacity>
  );
}

export default function MyEvidenceScreen() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  const fetchEvidence = useCallback(async () => {
    try {
      const walletAddress = await SecureStore.getItemAsync("walletAddress");
      if (!walletAddress) return;
      const data = await getEvidenceByUser(walletAddress);
      setEvidence(data);
    } catch (e) {
      console.error("Failed to fetch evidence:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handlePress = async (item: EvidenceItem) => {
    if (item.isPublic) {
      Linking.openURL(`https://${PINATA_GATEWAY}/ipfs/${item.videoHash}`);
      return;
    }

    try {
      setDecrypting(true);

      // 1. Download encrypted file from IPFS
      const downloadPath = FileSystem.cacheDirectory + "encrypted_evidence";
      const download = await FileSystem.downloadAsync(
        `https://${PINATA_GATEWAY}/ipfs/${item.videoHash}`,
        downloadPath,
      );

      // 2. Read as base64 and convert to Uint8Array
      const base64Data = await FileSystem.readAsStringAsync(download.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const bundle = decodeBase64(base64Data);

      // 3. Derive keys from stored seed phrase
      const seedPhrase = await SecureStore.getItemAsync("seedPhrase");
      if (!seedPhrase) throw new Error("No seed phrase found");
      const { publicKey, privateKey } = await deriveKeys(seedPhrase);

      // 4. Decrypt
      const decrypted = decryptVideo(bundle, publicKey, privateKey);

      // 5. Write decrypted video to temp file
      const tempPath = FileSystem.cacheDirectory + "decrypted_evidence.mp4";
      const base64Video = encodeBase64(decrypted);
      await FileSystem.writeAsStringAsync(tempPath, base64Video, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 6. Show video player
      setVideoUri(tempPath);
    } catch (e: any) {
      Alert.alert("Decryption Failed", e.message);
    } finally {
      setDecrypting(false);
    }
  };

  const closePlayer = async () => {
    setVideoUri(null);
    // Clean up temp file
    const tempPath = FileSystem.cacheDirectory + "decrypted_evidence.mp4";
    await FileSystem.deleteAsync(tempPath, { idempotent: true });
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
      {decrypting && (
        <View style={styles.decryptingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.decryptingText}>Decrypting video...</Text>
        </View>
      )}

      <FlatList
        data={evidence}
        keyExtractor={(item, i) => `${item.videoHash}-${i}`}
        renderItem={({ item }) => (
          <EvidenceCard
            item={item}
            onPress={() => handlePress(item)}
            isDecrypting={decrypting}
          />
        )}
        contentContainerStyle={
          evidence.length === 0 ? styles.center : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No evidence recorded yet</Text>
        }
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          fetchEvidence();
        }}
      />

      <Modal
        visible={!!videoUri}
        animationType="slide"
        onRequestClose={closePlayer}
      >
        <SafeAreaView style={styles.playerContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closePlayer}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          {videoUri && (
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
            />
          )}
        </SafeAreaView>
      </Modal>
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
  decryptingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26,26,46,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  decryptingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 12,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 16,
  },
  closeButtonText: {
    color: "#e94560",
    fontSize: 16,
    fontWeight: "bold",
  },
  video: {
    flex: 1,
  },
});
