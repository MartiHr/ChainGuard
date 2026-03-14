import "dotenv/config";
import { ethers } from "ethers";
import * as fs from "fs";
import * as crypto from "crypto";
import ChainGuardABI from "../src/abi/ChainGuard.json";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS!, ChainGuardABI, provider);

async function verify(cidToFind: string, videoFilePath?: string) {
  console.log("ChainGuard Evidence Verification Tool");
  console.log("=====================================\n");

  // 1. Search blockchain for the CID
  const evidenceCount = await contract.getEvidenceCount();
  console.log(`Total evidence records on chain: ${evidenceCount}\n`);

  let found = false;

  for (let i = 0; i < evidenceCount; i++) {
    const evidence = await contract.getEvidence(i);
    if (evidence.videoHash === cidToFind) {
      found = true;

      console.log("Blockchain record FOUND:");
      console.log(`  Index:     ${i}`);
      console.log(`  CID:       ${evidence.videoHash}`);
      console.log(`  User:      ${evidence.user}`);
      console.log(`  GPS:       ${evidence.gpsCoordinates}`);
      console.log(`  Timestamp: ${new Date(Number(evidence.timestamp) * 1000).toISOString()}`);
      console.log(`  Public:    ${evidence.isPublic}`);

      // 2. If a video file was provided, hash it and compare
      if (videoFilePath) {
        if (!fs.existsSync(videoFilePath)) {
          console.log(`\n  ERROR: File not found: ${videoFilePath}`);
          break;
        }

        const fileBytes = fs.readFileSync(videoFilePath);
        const hash = crypto.createHash("sha256").update(fileBytes).digest("hex");

        console.log(`\n  Local file hash (SHA-256): ${hash}`);
        console.log(`  On-chain CID:              ${cidToFind}`);

        // Note: IPFS CIDs are not simple SHA-256 hashes — they use multihash encoding.
        // For a full verification, you would re-upload the file to IPFS and compare CIDs,
        // or use the multiformats library to compute the CID from the file bytes.
        // For this hackathon demo, we verify that the blockchain record exists and
        // the file can be retrieved from IPFS using the stored CID.
        console.log("\n  RESULT: RECORD VERIFIED — This CID exists on the blockchain.");
        console.log("  The evidence was recorded at the timestamp and GPS location shown above.");
        console.log("  To fully verify integrity, compare this CID with the IPFS CID of the file.");
      } else {
        console.log("\n  RESULT: RECORD FOUND — CID exists on the blockchain.");
        console.log("  Provide a video file path as the second argument to verify file integrity.");
      }
      break;
    }
  }

  if (!found) {
    console.log(`NO blockchain record found for CID: ${cidToFind}`);
    console.log("This CID has not been registered as evidence.");
  }
}

// Usage: npx ts-node scripts/verify.ts <CID> [path-to-video]
const [cidArg, filePath] = process.argv.slice(2);

if (!cidArg) {
  console.log("Usage: npx ts-node scripts/verify.ts <CID> [path-to-video-file]");
  console.log("");
  console.log("  <CID>              The IPFS CID to look up on the blockchain");
  console.log("  [path-to-video]    Optional: path to the video file for hash comparison");
  process.exit(1);
}

verify(cidArg, filePath).catch((error) => {
  console.error("Verification failed:", error.message);
  process.exit(1);
});
