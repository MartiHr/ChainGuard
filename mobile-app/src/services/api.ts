// 10.0.2.2 is Android emulator's alias for host machine's localhost
// For physical devices, use your machine's IP address
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://10.0.2.2:3000";

export async function startSession(
  walletAddress: string,
  publicKey: string,
  isPublic: boolean,
  gpsCoordinates: string,
): Promise<string> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      walletAddress,
      publicKey,
      isPublic,
      gpsCoordinates,
    }),
  });
  if (!res.ok) throw new Error(`startSession failed: ${res.status}`);
  const data = await res.json();
  return data.sessionId;
}

export async function uploadChunk(
  sessionId: string,
  chunkUri: string,
  chunkIndex: number,
  gpsCoordinates?: string,
): Promise<void> {
  const formData = new FormData();
  formData.append("chunk", {
    uri: chunkUri,
    type: "video/mp4",
    name: `chunk_${chunkIndex}.mp4`,
  } as any);
  formData.append("chunkIndex", String(chunkIndex));
  if (gpsCoordinates) {
    formData.append("gpsCoordinates", gpsCoordinates);
  }

  const res = await fetch(`${API_BASE}/sessions/${sessionId}/chunks`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`uploadChunk failed: ${res.status}`);
}

export async function endSession(
  sessionId: string,
): Promise<{ cid: string; transactionHash: string }> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`endSession failed: ${res.status}`);
  return res.json();
}

export async function getEvidenceByUser(walletAddress: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/evidence/${walletAddress}`);
  if (!res.ok) throw new Error(`getEvidenceByUser failed: ${res.status}`);
  return res.json();
}

export async function getPublicEvidence(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/evidence/public`);
  if (!res.ok) throw new Error(`getPublicEvidence failed: ${res.status}`);
  return res.json();
}
