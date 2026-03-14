import { ethers } from "ethers";
import ChainGuardABI from "../abi/ChainGuard.json";

const MOCK_MODE = !process.env.CONTRACT_ADDRESS || !process.env.BACKEND_PRIVATE_KEY;

// In-memory store for mock mode
const mockEvidences: Array<{
  user: string;
  videoHash: string;
  gpsCoordinates: string;
  timestamp: number;
  isPublic: boolean;
}> = [];

function getContract() {
  if (MOCK_MODE) return null;
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY!, provider);
  return new ethers.Contract(process.env.CONTRACT_ADDRESS!, ChainGuardABI, wallet);
}

const contract = getContract();

export async function submitEvidence(
  videoHash: string,
  gpsCoordinates: string,
  isPublic: boolean,
  user: string
): Promise<string> {
  if (MOCK_MODE) {
    mockEvidences.push({
      user,
      videoHash,
      gpsCoordinates,
      timestamp: Math.floor(Date.now() / 1000),
      isPublic,
    });
    const mockTxHash = "0x" + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
    console.log("  [MOCK] Blockchain submission skipped. Mock tx:", mockTxHash);
    return mockTxHash;
  }
  const tx = await contract!.storeEvidence(videoHash, isPublic, user);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getEvidencesByUser(walletAddress: string) {
  if (MOCK_MODE) {
    return mockEvidences.filter((e) => e.user === walletAddress);
  }
  return contract!.getEvidencesByUser(walletAddress);
}

export async function getPublicEvidences() {
  if (MOCK_MODE) {
    return mockEvidences.filter((e) => e.isPublic);
  }
  return contract!.getPublicFeed();
}
