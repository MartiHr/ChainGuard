import nacl from "tweetnacl";
import axios from "axios";
import { IPFS_GATEWAY } from "./config.ts";

/**
 * Derive X25519 keypair from BIP-39 mnemonic via PBKDF2 (Web Crypto).
 * Matches mobile-app/src/services/keys.ts: deriveKeys().
 */
async function deriveNaclKeys(
  mnemonic: string,
): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(mnemonic.normalize("NFKD")),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const seedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode("mnemonic"),
      iterations: 2048,
      hash: "SHA-512",
    },
    keyMaterial,
    512,
  );
  const first32 = new Uint8Array(seedBits).slice(0, 32);
  return nacl.box.keyPair.fromSecretKey(first32);
}

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

/**
 * Decrypt a video bundle encrypted by the backend (api/src/services/encryption.ts).
 *
 * Bundle: [ephemeralPubKey(32)][encryptedAesKey(48)][IV(12)][ciphertext + GCM authTag(16)]
 *
 * Steps:
 * 1. Derive X25519 keypair from mnemonic
 * 2. Nonce = SHA-256(ephemeralPubKey ‖ ownPublicKey)[0..24]
 * 3. nacl.box.open → AES key
 * 4. AES-256-GCM decrypt → plaintext video
 */
export async function decryptVideo(
  bundle: ArrayBuffer,
  mnemonic: string,
): Promise<ArrayBuffer> {
  const { publicKey, secretKey } = await deriveNaclKeys(mnemonic);
  const bytes = new Uint8Array(bundle);

  const EPHEMERAL_PK_LEN = 32;
  const ENCRYPTED_KEY_LEN = 48;
  const IV_LEN = 12;

  let offset = 0;
  const ephemeralPubKey = bytes.slice(offset, offset + EPHEMERAL_PK_LEN);
  offset += EPHEMERAL_PK_LEN;
  const encryptedAesKey = bytes.slice(offset, offset + ENCRYPTED_KEY_LEN);
  offset += ENCRYPTED_KEY_LEN;
  const iv = bytes.slice(offset, offset + IV_LEN);
  offset += IV_LEN;
  const encryptedVideo = bytes.slice(offset);

  // Derive nonce: SHA-256(ephemeralPubKey ‖ ownPublicKey), first 24 bytes
  const nonceInput = new Uint8Array(EPHEMERAL_PK_LEN + publicKey.length);
  nonceInput.set(ephemeralPubKey, 0);
  nonceInput.set(publicKey, EPHEMERAL_PK_LEN);
  const nonceHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", nonceInput),
  );
  const nonce = nonceHash.slice(0, 24);

  // Decrypt AES key
  const aesKeyBytes = nacl.box.open(encryptedAesKey, nonce, ephemeralPubKey, secretKey);
  if (!aesKeyBytes) {
    throw new Error("Failed to decrypt AES key. Wrong seed phrase?");
  }

  // Decrypt video with AES-256-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    new Uint8Array(aesKeyBytes) as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, encryptedVideo);
}
