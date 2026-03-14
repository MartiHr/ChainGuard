// @ts-ignore
// @ts-ignore
import { ethers } from "ethers";
import ChainGuardABI from "../../../abi/ChainGuard.json";

const MOCK_MODE =
  !process.env.CONTRACT_ADDRESS || !process.env.BACKEND_PRIVATE_KEY;

// In-memory store for mock mode
const mockEvidences: Array<{
  user: string;
  videoHash: string;
  latitude: string;
  longitude: string;
  timestamp: number;
  isPublic: boolean;
}> = [];

function getContract() {
  if (MOCK_MODE) return null;
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY!, provider);
  return new ethers.Contract(
    process.env.CONTRACT_ADDRESS!,
    ChainGuardABI,
    wallet,
  );
}

const contract = getContract();

/**
 * Parse GPS coordinates string into latitude and longitude
 * Expected format: "latitude,longitude" or empty string
 */
function parseGpsCoordinates(gpsCoordinates: string): {
  latitude: string;
  longitude: string;
} {
  if (!gpsCoordinates || !gpsCoordinates.includes(",")) {
    return { latitude: "0", longitude: "0" };
  }
  const [lat, lon] = gpsCoordinates.split(",").map((s) => s.trim());
  return { latitude: lat || "0", longitude: lon || "0" };
}

export async function initContract(): Promise<void> {
  if (MOCK_MODE) {
    console.log("Running in mock mode - no blockchain connection needed");
    return;
  }
  try {
    // Test connection by getting the block number
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log(`✓ Connected to blockchain at block ${blockNumber}`);
    console.log(`✓ Contract address: ${process.env.CONTRACT_ADDRESS}`);
  } catch (error) {
    throw new Error(`Failed to connect to blockchain: ${error}`);
  }
}

export async function checkBlockchainConnection(): Promise<{
  connected: boolean;
  mode: string;
  rpcUrl?: string;
  contractAddress?: string;
  blockNumber?: number;
  error?: string;
}> {
  if (MOCK_MODE) {
    return {
      connected: true,
      mode: "mock",
      error: "CONTRACT_ADDRESS or BACKEND_PRIVATE_KEY not set",
    };
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const blockNumber = await provider.getBlockNumber();

    // Try to get contract code to verify contract exists
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS!);
    if (code === "0x") {
      return {
        connected: false,
        mode: "production",
        rpcUrl: process.env.RPC_URL,
        contractAddress: process.env.CONTRACT_ADDRESS,
        error: "Contract not deployed at the specified address",
      };
    }

    return {
      connected: true,
      mode: "production",
      rpcUrl: process.env.RPC_URL,
      contractAddress: process.env.CONTRACT_ADDRESS,
      blockNumber,
    };
  } catch (error) {
    return {
      connected: false,
      mode: "production",
      rpcUrl: process.env.RPC_URL,
      contractAddress: process.env.CONTRACT_ADDRESS,
      error: String(error),
    };
  }
}

export async function submitEvidence(
  videoHash: string,
  gpsCoordinates: string,
  isPublic: boolean,
  user: string,
): Promise<string> {
  const { latitude, longitude } = parseGpsCoordinates(gpsCoordinates);

  if (MOCK_MODE) {
    mockEvidences.push({
      user,
      videoHash,
      latitude,
      longitude,
      timestamp: Math.floor(Date.now() / 1000),
      isPublic,
    });
    const mockTxHash =
      "0x" +
      [...Array(64)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("");
    console.log("  [MOCK] Blockchain submission skipped. Mock tx:", mockTxHash);
    return mockTxHash;
  }
  // Ensure the user argument is a valid Ethereum address (avoid ENS resolution on local chains)
  let userAddress: string;
  try {
    userAddress = ethers.getAddress(user);
  } catch (err) {
    throw new Error(`Invalid wallet address: ${user}`);
  }

  const tx = await contract!.storeEvidence(
    videoHash,
    isPublic,
    userAddress,
    latitude,
    longitude,
  );
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Convert contract data to JSON-serializable format
 * ethers.js v6 returns BigInt for numeric fields which can't be serialized to JSON
 */
function normalizeEvidenceData(evidence: any): any {
  // Deep convert all values using a JSON replacer function
  return JSON.parse(
    JSON.stringify(evidence, (key, value) => {
      // Convert BigInt to string with _bn suffix to preserve it's a number
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    }),
  );
}

export async function getEvidencesByUser(walletAddress: string) {
  if (MOCK_MODE) {
    return mockEvidences.filter((e) => e.user === walletAddress);
  }
  const evidence = await contract!.getEvidencesByUser(walletAddress);
  return normalizeEvidenceData(evidence);
}

export async function getPublicEvidences() {
  if (MOCK_MODE) {
    return mockEvidences.filter((e) => e.isPublic);
  }
  const evidence = await contract!.getPublicFeed();
  return normalizeEvidenceData(evidence);
}
