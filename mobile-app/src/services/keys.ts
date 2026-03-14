import * as bip39 from "bip39";
import nacl from "tweetnacl";
import * as naclUtil from "tweetnacl-util";
import * as ethers from "ethers";

export function generateSeedPhrase(): string {
  return bip39.generateMnemonic(128);
}

export async function deriveKeys(seedPhrase: string): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  address: string;
  ethPrivateKey: string;
}> {
  const seed = await bip39.mnemonicToSeed(seedPhrase);
  const first32 = new Uint8Array(seed.buffer, seed.byteOffset, 32);
  const keyPair = nacl.box.keyPair.fromSecretKey(first32);

  // Derive Ethereum wallet from the same seed
  const wallet = ethers.Wallet.fromPhrase(seedPhrase);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.secretKey,
    address: wallet.address,
    ethPrivateKey: wallet.privateKey,
  };
}

export function publicKeyToBase64(publicKey: Uint8Array): string {
  return naclUtil.encodeBase64(publicKey);
}
