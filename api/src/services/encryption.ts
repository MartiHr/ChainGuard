import nacl from "tweetnacl";
import fs from "fs/promises";
import crypto from "crypto";

export async function encryptVideo(
  videoPath: string,
  publicKeyBase64: string
): Promise<Buffer> {
  const publicKey = Buffer.from(publicKeyBase64, "base64");
  const videoBuffer = await fs.readFile(videoPath);

  // 1. Generate random AES-256-GCM key and IV
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  // 2. Encrypt video with AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(videoBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16 bytes

  // Combine encrypted video + auth tag
  const encryptedVideo = Buffer.concat([encrypted, authTag]);

  // 3. Encrypt AES key with user's X25519 public key using ephemeral keypair
  const ephemeral = nacl.box.keyPair();
  const nonce = new Uint8Array(24);
  // Derive nonce from ephemeral public key + recipient public key
  const nonceInput = Buffer.concat([Buffer.from(ephemeral.publicKey), publicKey]);
  const nonceHash = crypto.createHash("sha256").update(nonceInput).digest();
  nonce.set(nonceHash.subarray(0, 24));

  const encryptedAesKey = nacl.box(
    new Uint8Array(aesKey),
    nonce,
    new Uint8Array(publicKey),
    ephemeral.secretKey
  );

  // 4. Build bundle: [ephemeralPubKey (32 bytes)][encryptedAesKey (48 bytes)][IV (12 bytes)][encryptedVideo]
  const bundle = Buffer.alloc(
    ephemeral.publicKey.length + encryptedAesKey.length + iv.length + encryptedVideo.length
  );
  let offset = 0;
  bundle.set(ephemeral.publicKey, offset);
  offset += ephemeral.publicKey.length;
  bundle.set(encryptedAesKey, offset);
  offset += encryptedAesKey.length;
  bundle.set(iv, offset);
  offset += iv.length;
  encryptedVideo.copy(bundle, offset);

  return bundle;
}
