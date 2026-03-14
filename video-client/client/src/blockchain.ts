import { ethers } from 'ethers';
import type { WalletState, EvidenceRecord } from './types.ts';
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL } from './config.ts';

export function walletFromMnemonic(mnemonic: string): WalletState {
  const trimmed = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  const wallet = ethers.HDNodeWallet.fromPhrase(trimmed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: trimmed,
  };
}

function mapRawRecords(
  raw: Array<{
    cid: string;
    timestamp: bigint;
    owner: string;
    isPublic: boolean;
    latitude: string;
    longitude: string;
  }>
): EvidenceRecord[] {
  return raw.map((r, index) => ({
    id: index,
    cid: r.cid,
    timestamp: Number(r.timestamp),
    latitude: r.latitude,
    longitude: r.longitude,
    txHash: '',
    owner: r.owner,
  }));
}

export async function fetchRecords(
  walletAddress: string
): Promise<EvidenceRecord[]> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
  );

  // Fetch only the records that belong to this wallet address
  const raw = await contract.getEvidencesByUser(walletAddress);
  return mapRawRecords(raw);
}
