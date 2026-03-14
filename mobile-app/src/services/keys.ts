import * as bip39 from "bip39";
import nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";

export function generateSeedPhrase(): string {
  return bip39.generateMnemonic(128);
}

export async function deriveKeys(
  seedPhrase: string
): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  const first32 = new Uint8Array(seed.buffer, seed.byteOffset, 32);
  const keyPair = nacl.box.keyPair.fromSecretKey(first32);
  return { publicKey: keyPair.publicKey, privateKey: keyPair.secretKey };
}

export function publicKeyToBase64(publicKey: Uint8Array): string {
  return naclUtil.encodeBase64(publicKey);
}
