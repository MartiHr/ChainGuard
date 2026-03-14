export interface EvidenceRecord {
  id: number;
  cid: string;
  timestamp: number;
  latitude: string;
  longitude: string;
  txHash: string;
  owner: string;
}

export interface WalletState {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export type DownloadStage =
  | "idle"
  | "fetching"
  | "verifying"
  | "decrypting"
  | "saving";
