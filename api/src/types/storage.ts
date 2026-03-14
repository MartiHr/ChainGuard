export interface Session {
  walletAddress: string;
  publicKey: string;
  isPublic: boolean;
  gpsCoordinates: string;
  chunkCount: number;
  dir: string;
}
