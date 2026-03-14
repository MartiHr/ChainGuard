import axios from "axios";
import { IPFS_GATEWAY } from "./config.ts";

export async function fetchFromIPFS(cid: string): Promise<ArrayBuffer> {
  const resp = await axios.get(`${IPFS_GATEWAY}/${cid}`, {
    responseType: "arraybuffer",
  });
  return resp.data as ArrayBuffer;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function decryptVideo(
  encryptedBytes: ArrayBuffer,
  privateKeyHex: string,
): Promise<ArrayBuffer> {
  // Derive a 256-bit AES key from the private key via HKDF
  const rawKey = hexToBytes(privateKeyHex.replace(/^0x/, ""));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveKey"],
  );
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("ChainGuard-v1"),
      info: new TextEncoder().encode("video-encryption"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
