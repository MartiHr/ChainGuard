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
import { decodeBase64, encodeBase64 } from "tweetnacl-util";
import { getEvidenceByUser } from "../src/services/api";
import { decryptVideo } from "../src/services/decryption";
import { deriveKeys } from "../src/services/keys";

import { EvidenceItem } from "../src/types";
import { EvidenceCard } from "../src/components/EvidenceCard";

const PINATA_GATEWAY = process.env.EXPO_PUBLIC_PINATA_GATEWAY || "moccasin-glamorous-penguin-689.mypinata.cloud";

let ExpoVideo: any = null;
let ExpoResizeMode: any = { CONTAIN: "contain" };
try {
  const expoAv = require("expo-av");
  ExpoVideo = expoAv.Video;
  ExpoResizeMode = expoAv.ResizeMode;
} catch {
  // Keep route loadable when expo-av native module is missing.
}


export default function MyEvidenceScreen() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const videoRef = useRef<any>(null);

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
      Linking.openURL(`https://${PINATA_GATEWAY}/ipfs/${item.cid}`);
      return;
    }

    try {
      setDecrypting(true);

      // 1. Download encrypted file from IPFS
      const downloadPath = FileSystem.cacheDirectory + "encrypted_evidence";
      const download = await FileSystem.downloadAsync(
        `https://${PINATA_GATEWAY}/ipfs/${item.cid}`,
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
        keyExtractor={(item, i) => `${item.cid}-${i}`}
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
            ExpoVideo ? (
              <ExpoVideo
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.video}
                useNativeControls
                resizeMode={ExpoResizeMode.CONTAIN}
                shouldPlay
              />
            ) : (
              <View style={styles.fallbackContainer}>
                <Text style={styles.fallbackText}>Video playback module is unavailable in this build.</Text>
                <TouchableOpacity
                  style={styles.openExternallyButton}
                  onPress={() => {
                    if (videoUri) {
                      Linking.openURL(videoUri);
                    }
                  }}
                >
                  <Text style={styles.openExternallyButtonText}>Open Externally</Text>
                </TouchableOpacity>
              </View>
            )
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
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  fallbackText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  openExternallyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#e94560",
  },
  openExternallyButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
