import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  generateSeedPhrase,
  deriveKeys,
  publicKeyToBase64,
} from "../src/services/keys";

export default function OnboardingScreen() {
  const router = useRouter();
  const [seedPhrase, setSeedPhrase] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSeedPhrase(generateSeedPhrase());
  }, []);

  const words = seedPhrase.split(" ");

  const handleContinue = async () => {
    setSaving(true);
    try {
      const keys = await deriveKeys(seedPhrase);
      const pubKeyBase64 = publicKeyToBase64(keys.publicKey);
      await SecureStore.setItemAsync("seedPhrase", seedPhrase);
      await SecureStore.setItemAsync("publicKey", pubKeyBase64);
      router.replace("/home");
    } catch (e) {
      console.error("Failed to save keys:", e);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Seed Phrase</Text>
        <Text style={styles.description}>
          Write down these 12 words and keep them safe. This is the only way to
          recover your identity and evidence.
        </Text>
        <View style={styles.seedGrid}>
          {words.map((word, i) => (
            <View key={i} style={styles.wordBox}>
              <Text style={styles.wordIndex}>{i + 1}</Text>
              <Text style={styles.word}>{word}</Text>
            </View>
          ))}
        </View>
        <View style={styles.confirmRow}>
          <Switch
            value={confirmed}
            onValueChange={setConfirmed}
            trackColor={{ false: "#0f3460", true: "#e94560" }}
            thumbColor="#ffffff"
          />
          <Text style={styles.confirmText}>
            I have backed up my seed phrase
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.button, (!confirmed || saving) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!confirmed || saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Setting up..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  seedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  wordBox: {
    width: "30%",
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  wordIndex: { color: "#888888", fontSize: 12, marginRight: 6, width: 16 },
  word: { color: "#ffffff", fontSize: 14, fontWeight: "600" },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    alignSelf: "center",
  },
  confirmText: { color: "#cccccc", fontSize: 14, marginLeft: 10 },
  button: {
    backgroundColor: "#e94560",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
});
