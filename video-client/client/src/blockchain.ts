import { ethers } from 'ethers';
import type { WalletState, EvidenceRecord } from './types.ts';
import { CONTRACT_ADDRESS, RPC_URL } from './config.ts';

import ChainGuardABI from '../../../abi/ChainGuard.json';

export function walletFromMnemonic(mnemonic: string): WalletState {
  const trimmed = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  const wallet = ethers.HDNodeWallet.fromPhrase(trimmed);
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: trimmed,
  };
}

function toEvidenceRecord(r: any, index: number): EvidenceRecord {
  return {
    id: index,
    cid: r.cid,
    timestamp: Number(r.timestamp.toString()),
    latitude: r.latitude,
    longitude: r.longitude,
    txHash: '',
    owner: r.owner,
    isPublic: Boolean(r.isPublic),
  };
}

export async function fetchRecords(
  walletAddress: string
): Promise<EvidenceRecord[]> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ChainGuardABI,
    provider
  );

  // Make sure this is a view function in Solidity
  const raw = await contract.getEvidencesByUser(walletAddress);

  return raw.map(toEvidenceRecord);
}

export async function fetchPublicRecords(): Promise<EvidenceRecord[]> {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    ChainGuardABI,
    provider
  );

  const raw = await contract.getPublicFeed();
  return raw.map(toEvidenceRecord);
}
