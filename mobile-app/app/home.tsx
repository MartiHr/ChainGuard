import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function HomeScreen() {
  const router = useRouter();
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync("publicKey").then(setPublicKey);
  }, []);

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}`
    : "Loading...";

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.walletLabel}>Your Identity</Text>
        <Text style={styles.walletAddress}>{truncatedKey}</Text>

        <TouchableOpacity
          style={styles.sosButton}
          onPress={() => router.push("/recording?mode=private")}
        >
          <Text style={styles.sosButtonText}>Private SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.broadcastButton}
          onPress={() => router.push("/recording?mode=public")}
        >
          <Text style={styles.broadcastButtonText}>Public Broadcast</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={async () => {
            await SecureStore.deleteItemAsync("seedPhrase");
            await SecureStore.deleteItemAsync("publicKey");
            await SecureStore.deleteItemAsync("walletAddress");
            router.replace("/onboarding");
          }}
        >
          <Text style={styles.resetButtonText}>Reset App</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  walletLabel: { fontSize: 14, color: "#888888", marginBottom: 4 },
  walletAddress: {
    fontSize: 16,
    color: "#cccccc",
    fontFamily: "monospace",
    marginBottom: 48,
  },
  sosButton: {
    backgroundColor: "#e94560",
    width: "100%",
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#e94560",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: { color: "#ffffff", fontSize: 22, fontWeight: "bold" },
  broadcastButton: {
    backgroundColor: "#0f3460",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  broadcastButtonText: { color: "#e94560", fontSize: 18, fontWeight: "bold" },
  resetButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#333333",
  },
  resetButtonText: { color: "#ffaaaa", fontSize: 14 },
});
