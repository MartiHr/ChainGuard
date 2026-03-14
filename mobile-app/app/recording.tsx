import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import { startSession, uploadChunk, endSession } from "../src/services/api";

type RecordingState = "initializing" | "recording" | "stopping" | "done";

export default function RecordingScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const isPublic = mode === "public";

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [state, setState] = useState<RecordingState>("initializing");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState(0);
  const [gps, setGps] = useState("Acquiring...");
  const [result, setResult] = useState<{
    cid: string;
    transactionHash: string;
  } | null>(null);
  const [error, setError] = useState("");
  const stopRequested = useRef(false);
  const isRecording = useRef(false);

  useEffect(() => {
    initSession();
  }, []);

  async function getGps(): Promise<string> {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = `${loc.coords.latitude.toFixed(6)},${loc.coords.longitude.toFixed(6)}`;
      setGps(coords);
      return coords;
    } catch {
      return gps;
    }
  }

  async function initSession() {
    try {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      if (!micPermission?.granted) {
        await requestMicPermission();
      }
      const { status: locStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locStatus !== "granted") {
        setError("Location permission is required");
        return;
      }

      const publicKey = await SecureStore.getItemAsync("publicKey");
      if (!publicKey) {
        setError("No identity found. Please complete onboarding.");
        return;
      }

      const coords = await getGps();
      const sid = await startSession(publicKey, publicKey, isPublic, coords);
      setSessionId(sid);
      setState("recording");

      // Start recording loop after a brief delay for camera to mount
      setTimeout(() => recordLoop(sid), 500);
    } catch (e: any) {
      setError(`Failed to start session: ${e.message}`);
    }
  }

  async function recordLoop(sid: string) {
    let idx = 0;
    // Wait for camera to fully initialize
    await new Promise((r) => setTimeout(r, 1000));

    while (!stopRequested.current) {
      try {
        if (!cameraRef.current) {
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }

        // Only stop a stale recording if one was in progress
        if (isRecording.current) {
          try { cameraRef.current.stopRecording(); } catch {}
          await new Promise((r) => setTimeout(r, 500));
        }

        isRecording.current = true;
        const video = await cameraRef.current.recordAsync({
          maxDuration: 10,
        });
        isRecording.current = false;

        if (!video || stopRequested.current) break;

        const coords = await getGps();
        await uploadChunk(sid, video.uri, idx, coords);
        await FileSystem.deleteAsync(video.uri, { idempotent: true });

        idx++;
        setChunkCount(idx);
      } catch (e: any) {
        console.error("Chunk error:", e);
        if (isRecording.current) {
          try { cameraRef.current?.stopRecording(); } catch {}
          isRecording.current = false;
        }
        if (stopRequested.current) break;
        // Longer delay before retrying to let camera recover
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  async function handleStop() {
    stopRequested.current = true;
    setState("stopping");

    if (isRecording.current && cameraRef.current) {
      cameraRef.current.stopRecording();
    }

    if (sessionId) {
      try {
        const res = await endSession(sessionId);
        setResult(res);
      } catch (e: any) {
        setError(`Failed to finalize: ${e.message}`);
      }
    }
    setState("done");
  }

  if (!cameraPermission?.granted && state === "initializing") {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <View style={styles.content}>
          <Text style={styles.status}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {state !== "done" && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          mode="video"
        />
      )}
      <View style={styles.overlay}>
        <View
          style={[
            styles.badge,
            isPublic ? styles.badgePublic : styles.badgePrivate,
          ]}
        >
          <Text style={styles.badgeText}>
            {isPublic ? "PUBLIC" : "PRIVATE"}
          </Text>
        </View>

        {state === "recording" && (
          <>
            <View style={styles.recIndicator}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>REC</Text>
            </View>
            <Text style={styles.status}>Chunks uploaded: {chunkCount}</Text>
            <Text style={styles.subStatus}>GPS: {gps}</Text>
            <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
              <Text style={styles.stopButtonText}>Stop Recording</Text>
            </TouchableOpacity>
          </>
        )}

        {state === "stopping" && (
          <Text style={styles.status}>Finalizing...</Text>
        )}

        {state === "done" && result && (
          <>
            <Text style={styles.doneTitle}>Evidence Secured</Text>
            <Text style={styles.status}>Chunks: {chunkCount}</Text>
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>CID</Text>
              <Text style={styles.resultValue}>{result.cid}</Text>
              <Text style={styles.resultLabel}>Transaction</Text>
              <Text style={styles.resultValue}>
                {result.transactionHash.slice(0, 20)}...
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.stopButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        )}

        {state === "done" && !result && error && (
          <>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => router.replace("/home")}
            >
              <Text style={styles.stopButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        )}

        {error && state !== "done" && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  camera: { ...StyleSheet.absoluteFillObject },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(26,26,46,0.6)",
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 32,
  },
  badgePublic: { backgroundColor: "#e94560" },
  badgePrivate: { backgroundColor: "#0f3460" },
  badgeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  recIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e94560",
    marginRight: 8,
  },
  recText: { color: "#e94560", fontSize: 18, fontWeight: "bold" },
  status: { fontSize: 18, color: "#ffffff", marginBottom: 8 },
  subStatus: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "monospace",
  },
  stopButton: {
    backgroundColor: "#e94560",
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  stopButtonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  doneTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  resultBox: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  resultLabel: {
    color: "#888888",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  resultValue: { color: "#ffffff", fontSize: 14, fontFamily: "monospace" },
  error: { color: "#e94560", fontSize: 14, marginTop: 12, textAlign: "center" },
});
