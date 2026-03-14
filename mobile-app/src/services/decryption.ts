import nacl from "tweetnacl";
import { sha256 } from "@noble/hashes/sha2.js";
import { gcm } from "@noble/ciphers/aes.js";

/**
 * Decrypts a video bundle encrypted by the backend.
 *
 * Bundle format (from chainguard-backend/src/services/encryption.ts):
 * [ephemeralPubKey (32 bytes)][encryptedAesKey (48 bytes)][IV (12 bytes)][encryptedVideo + GCM authTag (16 bytes)]
 *
 * The backend uses nacl.box() with an ephemeral keypair.
 * Nonce = SHA-256(ephemeralPubKey + recipientPubKey).slice(0, 24)
 */
export function decryptVideo(
  bundle: Uint8Array,
  publicKey: Uint8Array,
  privateKey: Uint8Array
): Uint8Array {
  const EPHEMERAL_PK_LEN = 32;
  const ENCRYPTED_KEY_LEN = 48; // 32 (key) + 16 (nacl.box overhead)
  const IV_LEN = 12;

  // 1. Extract parts from bundle
  let offset = 0;
  const ephemeralPubKey = bundle.slice(offset, offset + EPHEMERAL_PK_LEN);
  offset += EPHEMERAL_PK_LEN;
  const encryptedAesKey = bundle.slice(offset, offset + ENCRYPTED_KEY_LEN);
  offset += ENCRYPTED_KEY_LEN;
  const iv = bundle.slice(offset, offset + IV_LEN);
  offset += IV_LEN;
  const encryptedVideo = bundle.slice(offset); // includes GCM auth tag (last 16 bytes)

  // 2. Derive nonce: SHA-256(ephemeralPubKey + ownPublicKey), first 24 bytes
  const nonceInput = new Uint8Array(EPHEMERAL_PK_LEN + publicKey.length);
  nonceInput.set(ephemeralPubKey, 0);
  nonceInput.set(publicKey, EPHEMERAL_PK_LEN);
  const nonce = sha256(nonceInput).slice(0, 24);

  // 3. Decrypt AES key with nacl.box.open
  const aesKeyBytes = nacl.box.open(encryptedAesKey, nonce, ephemeralPubKey, privateKey);
  if (!aesKeyBytes) {
    throw new Error("Failed to decrypt AES key. Wrong seed phrase?");
  }

  // 4. Decrypt video with AES-256-GCM
  const aes = gcm(aesKeyBytes, iv);
  return aes.decrypt(encryptedVideo);
}
