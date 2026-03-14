import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as bip39 from "bip39";
import { deriveKeys, publicKeyToBase64 } from "../src/services/keys";

export default function RecoveryScreen() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);

  const handleRecover = async () => {
    const phrase = input.trim().toLowerCase();
    if (!bip39.validateMnemonic(phrase)) {
      setError("Invalid seed phrase. Please check your words and try again.");
      return;
    }
    setError("");
    setRecovering(true);
    try {
      const keys = await deriveKeys(phrase);
      const pubKeyBase64 = publicKeyToBase64(keys.publicKey);
      await SecureStore.setItemAsync("seedPhrase", phrase);
      await SecureStore.setItemAsync("publicKey", pubKeyBase64);
      router.replace("/home");
    } catch (e) {
      console.error("Recovery failed:", e);
      setError("Recovery failed. Please try again.");
      setRecovering(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Recover Your Identity</Text>
        <Text style={styles.description}>
          Enter your 12-word seed phrase to restore your wallet and evidence
          history.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your 12 words separated by spaces..."
          placeholderTextColor="#888888"
          multiline
          numberOfLines={3}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            setError("");
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, recovering && styles.buttonDisabled]}
          onPress={handleRecover}
          disabled={recovering}
        >
          <Text style={styles.buttonText}>
            {recovering ? "Recovering..." : "Recover"}
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    minHeight: 100,
    textAlignVertical: "top",
  },
  error: { color: "#e94560", fontSize: 14, marginBottom: 12 },
  button: {
    backgroundColor: "#e94560",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
});
