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

  // Convert BigNumbers properly
  return raw.map((r: any, index: number) => ({
    id: index,
    cid: r.cid,
    timestamp: Number(r.timestamp.toString()), // if it's BigNumber
    latitude: r.latitude,
    longitude: r.longitude,
    txHash: '', // Optional, can add if needed
    owner: r.owner,
  }));
}
