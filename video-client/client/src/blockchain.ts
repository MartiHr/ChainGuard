import { ethers } from "ethers";
import type { WalletState, EvidenceRecord } from "./types.ts";
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL } from "./config.ts";

export function walletFromMnemonic(mnemonic: string): WalletState {
  const trimmed = mnemonic.trim().toLowerCase().replace(/\s+/g, " ");
  const wallet = ethers.HDNodeWallet.fromPhrase(trimmed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: trimmed,
  };
}

export async function fetchRecords(
  walletAddress: string,
): Promise<EvidenceRecord[]> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider,
  );

  const raw: Array<{
    id: bigint;
    cid: string;
    timestamp: bigint;
    latitude: string;
    longitude: string;
    owner: string;
  }> = await contract.getRecordsByOwner(walletAddress);

  return raw.map((r) => ({
    id: Number(r.id),
    cid: r.cid,
    timestamp: Number(r.timestamp),
    latitude: r.latitude,
    longitude: r.longitude,
    txHash: "", // filled below if available
    owner: r.owner,
  }));
}
